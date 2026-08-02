import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  Stack,
  Link,
} from "@mui/material";
import {
  getConfig,
  saveConfig,
  testConnection,
  syncTemplates,
  invalidateOctokitCache,
  type GitHubConfig,
} from "../github";
import { useLoadingContext } from "../context/LoadingContext";
import { useToastContext, TOAST_TYPES } from "../context/ToastContext";

type SettingsPageProps = {
  onConfigured: () => void;
  allowSkip?: boolean;
  onClose?: () => void;
};

const emptyForm = (): GitHubConfig => ({
  token: "",
  owner: "",
  repo: "",
  branch: "main",
});

function SettingsPage({ onConfigured, allowSkip, onClose }: SettingsPageProps) {
  const existing = getConfig();
  const [form, setForm] = useState<GitHubConfig>(existing ?? emptyForm());
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testOk, setTestOk] = useState<boolean | null>(null);
  const { loadingProcess } = useLoadingContext();
  const { showToast } = useToastContext();

  const updateField = (key: keyof GitHubConfig, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
    setTestOk(null);
  };

  const handleTest = async () => {
    const result = await loadingProcess(async () => {
      return testConnection(form);
    });
    if ((result as any).ok) {
      setTestOk(true);
      setTestResult(`Connected to ${(result as any).fullName}`);
    } else {
      setTestOk(false);
      setTestResult((result as any).error || "Connection failed");
    }
  };

  const handleSave = async () => {
    if (!form.token.trim() || !form.owner.trim() || !form.repo.trim()) {
      showToast("Token, owner, and repo are required", TOAST_TYPES.ERROR);
      return;
    }

    try {
      await loadingProcess(async () => {
        const result = await testConnection(form);
        if (!result.ok) {
          throw new Error(result.error);
        }
        saveConfig({
          token: form.token.trim(),
          owner: form.owner.trim(),
          repo: form.repo.trim(),
          branch: (form.branch || "main").trim(),
        });
        invalidateOctokitCache();
        await syncTemplates();
        return { ok: true };
      });

      showToast("Settings saved and templates synced", TOAST_TYPES.SUCCESS);
      onConfigured();
    } catch (error: any) {
      showToast(error?.message || "Failed to save settings", TOAST_TYPES.ERROR);
    }
  };

  const handleSyncOnly = async () => {
    try {
      await loadingProcess(async () => {
        saveConfig({
          token: form.token.trim(),
          owner: form.owner.trim(),
          repo: form.repo.trim(),
          branch: (form.branch || "main").trim(),
        });
        invalidateOctokitCache();
        await syncTemplates();
        return { ok: true };
      });
      showToast("Templates synced", TOAST_TYPES.SUCCESS);
    } catch (error: any) {
      showToast(error?.message || "Template sync failed", TOAST_TYPES.ERROR);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          GitHub Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This editor runs entirely in the browser. Enter a Personal Access
          Token with write access to your blog repository. Prefer a
          fine-grained token limited to Contents write on that repo only. The
          token is stored only in this browser&apos;s localStorage.
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Do not use a shared or public computer. Anyone with access to this
          browser can use your token.
        </Alert>
        <Stack spacing={2}>
          <TextField
            label="Personal Access Token"
            type="password"
            value={form.token}
            onChange={(e) => updateField("token", e.target.value)}
            fullWidth
            autoComplete="off"
            helperText={
              <Link
                href="https://github.com/settings/tokens?type=beta"
                target="_blank"
                rel="noopener noreferrer"
              >
                Create a fine-grained PAT
              </Link>
            }
          />
          <TextField
            label="Owner"
            value={form.owner}
            onChange={(e) => updateField("owner", e.target.value)}
            fullWidth
            placeholder="your-github-username"
          />
          <TextField
            label="Repository"
            value={form.repo}
            onChange={(e) => updateField("repo", e.target.value)}
            fullWidth
            placeholder="git_blog"
          />
          <TextField
            label="Branch"
            value={form.branch}
            onChange={(e) => updateField("branch", e.target.value)}
            fullWidth
            placeholder="main"
          />
          {testResult && (
            <Alert severity={testOk ? "success" : "error"}>{testResult}</Alert>
          )}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="outlined" onClick={handleTest}>
              Test connection
            </Button>
            {existing && (
              <Button variant="outlined" onClick={handleSyncOnly}>
                Sync templates
              </Button>
            )}
            <Button variant="contained" onClick={handleSave}>
              Save &amp; continue
            </Button>
            {allowSkip && onClose && (
              <Button onClick={onClose}>Cancel</Button>
            )}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default SettingsPage;
