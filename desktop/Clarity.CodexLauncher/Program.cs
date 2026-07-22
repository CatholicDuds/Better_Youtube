using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Win32;

namespace Clarity.CodexLauncher;

internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        if (args.Any(arg => arg.Equals("--validate", StringComparison.OrdinalIgnoreCase)))
        {
            var workspace = WorkspaceLocator.Find();
            var webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
            return PromptLoader.Read().Contains("Curadoria manual do Clarity", StringComparison.Ordinal)
                && File.Exists(Path.Combine(workspace, "package.json"))
                && File.Exists(Path.Combine(webRoot, "index.html")) ? 0 : 3;
        }

        try
        {
            var workspace = WorkspaceLocator.FindOrChoose();
            Application.Run(new ClarityWindow(workspace));
            return 0;
        }
        catch (Exception error)
        {
            MessageBox.Show($"Não foi possível abrir o Clarity: {error.Message}", "Clarity", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}

internal sealed class ClarityWindow : Form
{
    private const string LocalHost = "clarity.local";
    private readonly string _workspace;
    private readonly string _webRoot;
    private readonly WebView2 _webView = new()
    {
        Dock = DockStyle.Fill,
        DefaultBackgroundColor = Color.FromArgb(15, 15, 15)
    };

    internal ClarityWindow(string workspace)
    {
        _workspace = workspace;
        _webRoot = Path.Combine(AppContext.BaseDirectory, "wwwroot");

        Text = "Clarity — vídeos que valem seu tempo";
        Width = 1480;
        Height = 920;
        MinimumSize = new Size(980, 680);
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(15, 15, 15);
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        HandleCreated += (_, _) => WindowTheme.ApplyDark(Handle);

        Controls.Add(_webView);
        Shown += async (_, _) => await InitializeWebView();
    }

    private async Task InitializeWebView()
    {
        if (!File.Exists(Path.Combine(_webRoot, "index.html")))
            throw new FileNotFoundException("A interface gráfica não foi encontrada dentro do executável.");

        var userData = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Clarity", "WebView2");
        var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: userData);
        await _webView.EnsureCoreWebView2Async(environment);

        _webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
        _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
        _webView.CoreWebView2.SetVirtualHostNameToFolderMapping(LocalHost, _webRoot, CoreWebView2HostResourceAccessKind.Allow);
        _webView.CoreWebView2.AddWebResourceRequestedFilter($"https://{LocalHost}/data/*", CoreWebView2WebResourceContext.All);
        _webView.CoreWebView2.WebResourceRequested += ServeLocalData;
        _webView.CoreWebView2.NavigationStarting += HandleNavigation;
        _webView.CoreWebView2.NavigationCompleted += (_, args) =>
        {
            if (!args.IsSuccess)
                MessageBox.Show($"Falha ao carregar a interface ({args.WebErrorStatus}).", "Clarity", MessageBoxButtons.OK, MessageBoxIcon.Error);
        };
        _webView.CoreWebView2.NewWindowRequested += OpenExternalLink;
        _webView.CoreWebView2.Navigate($"https://{LocalHost}/index.html");
    }

    private void ServeLocalData(object? sender, CoreWebView2WebResourceRequestedEventArgs args)
    {
        var uri = new Uri(args.Request.Uri);
        var fileName = Path.GetFileName(uri.LocalPath);
        if (string.IsNullOrWhiteSpace(fileName) || !fileName.EndsWith(".json", StringComparison.OrdinalIgnoreCase)) return;

        var path = Path.Combine(_workspace, "public", "data", fileName);
        if (!File.Exists(path))
        {
            args.Response = _webView.CoreWebView2.Environment.CreateWebResourceResponse(
                Stream.Null,
                404,
                "Not Found",
                "Content-Type: application/json; charset=utf-8\r\nCache-Control: no-store");
            return;
        }
        var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        args.Response = _webView.CoreWebView2.Environment.CreateWebResourceResponse(
            stream,
            200,
            "OK",
            "Content-Type: application/json; charset=utf-8\r\nCache-Control: no-store");
    }

    private void HandleNavigation(object? sender, CoreWebView2NavigationStartingEventArgs args)
    {
        if (!args.Uri.StartsWith("clarity-curator:", StringComparison.OrdinalIgnoreCase)) return;
        args.Cancel = true;
        BeginInvoke(() => OpenCodexCuration());
    }

    private void OpenExternalLink(object? sender, CoreWebView2NewWindowRequestedEventArgs args)
    {
        args.Handled = true;
        if (Uri.TryCreate(args.Uri, UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https")
            Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
    }

    private void OpenCodexCuration()
    {
        try
        {
            Clipboard.SetText($"Diretório do projeto: {_workspace}{Environment.NewLine}{Environment.NewLine}{PromptLoader.Read()}");
            var chatGpt = CodexBridge.FindChatGptWindow();
            if (chatGpt is null)
            {
                CodexBridge.Launch(_workspace);
                chatGpt = CodexBridge.WaitForChatGptWindow(TimeSpan.FromSeconds(20));
            }

            if (chatGpt is null || !CodexBridge.FocusAndPaste(chatGpt))
            {
                MessageBox.Show("O prompt está no clipboard. Abra uma tarefa no Codex e pressione Ctrl+V.", "Prompt copiado", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
        }
        catch (Exception error)
        {
            MessageBox.Show(error.Message, "Curar no Codex", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}

internal static class WindowTheme
{
    private const int UseImmersiveDarkMode = 20;
    private const int UseImmersiveDarkModeBefore1903 = 19;
    private const int BorderColor = 34;
    private const int CaptionColor = 35;
    private const int TextColor = 36;

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(nint window, int attribute, ref int value, int valueSize);

    internal static void ApplyDark(nint window)
    {
        if (!OperatingSystem.IsWindowsVersionAtLeast(10)) return;

        var enabled = 1;
        if (DwmSetWindowAttribute(window, UseImmersiveDarkMode, ref enabled, sizeof(int)) < 0)
            DwmSetWindowAttribute(window, UseImmersiveDarkModeBefore1903, ref enabled, sizeof(int));

        if (!OperatingSystem.IsWindowsVersionAtLeast(10, 0, 22000)) return;

        var border = ColorTranslator.ToWin32(Color.FromArgb(42, 42, 42));
        var caption = ColorTranslator.ToWin32(Color.FromArgb(15, 15, 15));
        var text = ColorTranslator.ToWin32(Color.FromArgb(238, 238, 238));
        DwmSetWindowAttribute(window, BorderColor, ref border, sizeof(int));
        DwmSetWindowAttribute(window, CaptionColor, ref caption, sizeof(int));
        DwmSetWindowAttribute(window, TextColor, ref text, sizeof(int));
    }
}

internal static class PromptLoader
{
    internal static string Read()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resource = assembly.GetManifestResourceNames().Single(name => name.EndsWith("curate-feed-with-codex.md", StringComparison.OrdinalIgnoreCase));
        using var stream = assembly.GetManifestResourceStream(resource) ?? throw new InvalidOperationException("Prompt editorial não encontrado.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }
}

internal static class WorkspaceLocator
{
    private const string RegistryPath = @"Software\Clarity";

    internal static string Find()
    {
        var configured = Environment.GetEnvironmentVariable("CLARITY_WORKSPACE");
        var stored = Registry.CurrentUser.OpenSubKey(RegistryPath)?.GetValue("Workspace") as string;
        var documents = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
        var known = Path.Combine(documents, "GitHub", "Better YouTube", "Better_Youtube");
        foreach (var origin in new[] { configured, stored, Environment.CurrentDirectory, AppContext.BaseDirectory, known }.Where(path => !string.IsNullOrWhiteSpace(path)))
        {
            var current = new DirectoryInfo(origin!);
            while (current is not null)
            {
                if (File.Exists(Path.Combine(current.FullName, "package.json")) && Directory.Exists(Path.Combine(current.FullName, "public", "data")))
                    return current.FullName;
                current = current.Parent;
            }
        }
        return string.Empty;
    }

    internal static string FindOrChoose()
    {
        var workspace = Find();
        if (!string.IsNullOrEmpty(workspace)) return workspace;

        using var picker = new FolderBrowserDialog { Description = "Selecione a pasta Better_Youtube que contém package.json", UseDescriptionForTitle = true };
        if (picker.ShowDialog() != DialogResult.OK || !File.Exists(Path.Combine(picker.SelectedPath, "package.json")))
            throw new InvalidOperationException("A pasta do projeto não foi selecionada.");

        using var key = Registry.CurrentUser.CreateSubKey(RegistryPath);
        key.SetValue("Workspace", picker.SelectedPath);
        return picker.SelectedPath;
    }
}

internal static class CodexBridge
{
    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(nint hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(nint hWnd, int nCmdShow);

    internal static Process? FindChatGptWindow() => Process.GetProcessesByName("ChatGPT")
        .FirstOrDefault(process => process.MainWindowHandle != nint.Zero);

    internal static Process? WaitForChatGptWindow(TimeSpan timeout)
    {
        var deadline = DateTime.UtcNow + timeout;
        while (DateTime.UtcNow < deadline)
        {
            var process = FindChatGptWindow();
            if (process is not null) return process;
            Thread.Sleep(500);
        }
        return null;
    }

    internal static void Launch(string workspace)
    {
        try
        {
            Process.Start(new ProcessStartInfo("codex", $"app \"{workspace}\"") { UseShellExecute = true });
            return;
        }
        catch { }
        Process.Start(new ProcessStartInfo("chatgpt:") { UseShellExecute = true });
    }

    internal static bool FocusAndPaste(Process process)
    {
        process.Refresh();
        if (process.MainWindowHandle == nint.Zero) return false;
        ShowWindow(process.MainWindowHandle, 9);
        if (!SetForegroundWindow(process.MainWindowHandle)) return false;
        Thread.Sleep(700);
        SendKeys.SendWait("^n");
        Thread.Sleep(1_200);
        var current = FindChatGptWindow() ?? process;
        current.Refresh();
        ShowWindow(current.MainWindowHandle, 9);
        SetForegroundWindow(current.MainWindowHandle);
        Thread.Sleep(400);
        SendKeys.SendWait("^v");
        return true;
    }
}
