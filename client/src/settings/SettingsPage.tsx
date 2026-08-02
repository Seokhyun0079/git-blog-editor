import { useMemo, useState } from "react";
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
  List,
  ListItem,
  ListItemText,
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
import { detectLocale, getSettingsCopy } from "../i18n/settings";

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
  const t = useMemo(() => getSettingsCopy(detectLocale()), []);
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
      setTestResult(t.connectedTo((result as any).fullName));
    } else {
      setTestOk(false);
      setTestResult((result as any).error || t.connectionFailed);
    }
  };

  const handleSave = async () => {
    if (!form.token.trim() || !form.owner.trim() || !form.repo.trim()) {
      showToast(t.requiredFields, TOAST_TYPES.ERROR);
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

      showToast(t.saveSuccess, TOAST_TYPES.SUCCESS);
      onConfigured();
    } catch (error: any) {
      showToast(error?.message || t.saveFailed, TOAST_TYPES.ERROR);
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
      showToast(t.syncSuccess, TOAST_TYPES.SUCCESS);
    } catch (error: any) {
      showToast(error?.message || t.syncFailed, TOAST_TYPES.ERROR);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t.title}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t.whatIsThis}
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t.howItWorksTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t.howItWorksBody}
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t.privacyTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t.privacyBody}
        </Typography>

        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {t.stepsTitle}
        </Typography>
        <List dense sx={{ mb: 2, py: 0 }}>
          {t.steps.map((step, index) => (
            <ListItem key={index} sx={{ py: 0.25, alignItems: "flex-start" }}>
              <ListItemText
                primary={`${index + 1}. ${step}`}
                primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
              />
            </ListItem>
          ))}
        </List>

        <Alert severity="info" sx={{ mb: 2 }}>
          {t.warning}
        </Alert>

        <Stack spacing={2}>
          <TextField
            label={t.tokenLabel}
            type="password"
            value={form.token}
            onChange={(e) => updateField("token", e.target.value)}
            fullWidth
            autoComplete="off"
            helperText={
              <>
                {t.tokenHelp}{" "}
                <Link
                  href="https://github.com/settings/tokens?type=beta"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.tokenLink}
                </Link>
              </>
            }
          />
          <TextField
            label={t.ownerLabel}
            value={form.owner}
            onChange={(e) => updateField("owner", e.target.value)}
            fullWidth
            placeholder={t.ownerPlaceholder}
          />
          <TextField
            label={t.repoLabel}
            value={form.repo}
            onChange={(e) => updateField("repo", e.target.value)}
            fullWidth
            placeholder={t.repoPlaceholder}
          />
          <TextField
            label={t.branchLabel}
            value={form.branch}
            onChange={(e) => updateField("branch", e.target.value)}
            fullWidth
            placeholder={t.branchPlaceholder}
          />
          {testResult && (
            <Alert severity={testOk ? "success" : "error"}>{testResult}</Alert>
          )}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="outlined" onClick={handleTest}>
              {t.testConnection}
            </Button>
            {existing && (
              <Button variant="outlined" onClick={handleSyncOnly}>
                {t.syncTemplates}
              </Button>
            )}
            <Button variant="contained" onClick={handleSave}>
              {t.saveContinue}
            </Button>
            {allowSkip && onClose && (
              <Button onClick={onClose}>{t.cancel}</Button>
            )}
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}

export default SettingsPage;
