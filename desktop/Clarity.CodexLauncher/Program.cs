using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace Clarity.CodexLauncher;

internal static class Program
{
    private const string ProtocolName = "clarity-curator";

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(nint hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(nint hWnd, int nCmdShow);

    [STAThread]
    private static int Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        if (args.Any(arg => arg.Equals("--validate", StringComparison.OrdinalIgnoreCase)))
        {
            var prompt = ReadEmbeddedPrompt();
            var workspace = FindWorkspace();
            return prompt.Contains("Curadoria manual do Clarity", StringComparison.Ordinal)
                && File.Exists(Path.Combine(workspace, "package.json")) ? 0 : 3;
        }

        if (args.Any(arg => arg.Equals("--register", StringComparison.OrdinalIgnoreCase)))
        {
            RegisterProtocol();
            MessageBox.Show("O botão ‘Curar no Codex’ já pode abrir este lançador.", "Clarity Curator", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return 0;
        }

        // Mantém o botão web associado ao local atual do executável sem exigir instalação administrativa.
        try { RegisterProtocol(); } catch { }

        try
        {
            var workspace = FindWorkspace();
            var prompt = ReadEmbeddedPrompt();
            Clipboard.SetText($"Diretório do projeto: {workspace}{Environment.NewLine}{Environment.NewLine}{prompt}");

            var chatGpt = FindChatGptWindow();
            if (chatGpt is null)
            {
                LaunchChatGpt(workspace);
                chatGpt = WaitForChatGptWindow(TimeSpan.FromSeconds(20));
            }

            if (chatGpt is null || !FocusAndPaste(chatGpt))
            {
                MessageBox.Show(
                    "O prompt foi copiado, mas não consegui confirmar o foco do ChatGPT. Abra uma nova tarefa no Codex e pressione Ctrl+V. O texto não foi enviado.",
                    "Prompt copiado",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);
                return 2;
            }

            MessageBox.Show(
                "O prompt foi colado em uma nova tarefa. Revise o texto e envie quando quiser; o lançador não pressiona Enter.",
                "Curadoria pronta",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);
            return 0;
        }
        catch (Exception error)
        {
            MessageBox.Show(
                $"Não foi possível preparar a curadoria: {error.Message}",
                "Clarity Curator",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return 1;
        }
    }

    private static string ReadEmbeddedPrompt()
    {
        var assembly = Assembly.GetExecutingAssembly();
        var resource = assembly.GetManifestResourceNames().Single(name => name.EndsWith("curate-feed-with-codex.md", StringComparison.OrdinalIgnoreCase));
        using var stream = assembly.GetManifestResourceStream(resource) ?? throw new InvalidOperationException("Prompt editorial não encontrado no executável.");
        using var reader = new StreamReader(stream);
        return reader.ReadToEnd();
    }

    private static string FindWorkspace()
    {
        foreach (var origin in new[] { Environment.CurrentDirectory, AppContext.BaseDirectory })
        {
            var current = new DirectoryInfo(origin);
            while (current is not null)
            {
                if (Directory.Exists(Path.Combine(current.FullName, ".git")) && File.Exists(Path.Combine(current.FullName, "package.json")))
                    return current.FullName;
                current = current.Parent;
            }
        }

        return Environment.CurrentDirectory;
    }

    private static Process? FindChatGptWindow() => Process.GetProcessesByName("ChatGPT")
        .FirstOrDefault(process => process.MainWindowHandle != nint.Zero);

    private static Process? WaitForChatGptWindow(TimeSpan timeout)
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

    private static void LaunchChatGpt(string workspace)
    {
        try
        {
            Process.Start(new ProcessStartInfo("codex", $"app \"{workspace}\"") { UseShellExecute = true });
            return;
        }
        catch { }

        Process.Start(new ProcessStartInfo("chatgpt:") { UseShellExecute = true });
    }

    private static bool FocusAndPaste(Process process)
    {
        process.Refresh();
        if (process.MainWindowHandle == nint.Zero) return false;

        ShowWindow(process.MainWindowHandle, 9);
        if (!SetForegroundWindow(process.MainWindowHandle)) return false;
        Thread.Sleep(700);

        // Abre uma tarefa nova, cola o prompt e deliberadamente não envia.
        SendKeys.SendWait("^n");
        Thread.Sleep(1_200);
        var currentWindow = FindChatGptWindow() ?? process;
        currentWindow.Refresh();
        ShowWindow(currentWindow.MainWindowHandle, 9);
        SetForegroundWindow(currentWindow.MainWindowHandle);
        Thread.Sleep(400);
        SendKeys.SendWait("^v");
        return true;
    }

    private static void RegisterProtocol()
    {
        var executable = Environment.ProcessPath ?? throw new InvalidOperationException("Caminho do executável indisponível.");
        using var protocol = Registry.CurrentUser.CreateSubKey($@"Software\Classes\{ProtocolName}");
        protocol.SetValue(string.Empty, "URL:Clarity Curator");
        protocol.SetValue("URL Protocol", string.Empty);
        using var command = protocol.CreateSubKey(@"shell\open\command");
        command.SetValue(string.Empty, $"\"{executable}\" \"%1\"");
    }
}
