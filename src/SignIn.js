import { useMemo, useState } from "react";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { useNavigate } from "react-router-dom";
import { signIn } from "./redux/requests";

const SignIn = () => {
  const [userInfo, setUserInfo] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const year = useMemo(() => new Date().getFullYear(), []);

  const handleEmailChange = (e) => {
    // Emaili her zaman küçük harfe çevir
    const v = (e.target.value || "").toLowerCase();
    setUserInfo((p) => ({ ...p, email: v }));
    setErrorMessage("");
  };

  const handlePasswordChange = (e) => {
    setUserInfo((p) => ({ ...p, password: e.target.value }));
    setErrorMessage("");
  };

  const handleSubmit = () => {
    setErrorMessage("");
    setLoading(true);
    signIn({
      ...userInfo,
      callback: (ok) => {
        setLoading(false);
        if (ok) {
          navigate("/");
        } else {
          setErrorMessage("E-posta veya şifre hatalı.");
        }
      },
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#fff",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 420 }}>
        {/* ÜST KONSEPT */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Box
            sx={{
              width: 84,
              height: 44,
              mx: "auto",
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              border: "1px solid #E5E7EB",
              color: "#C8A24A",
              fontWeight: 700,
              letterSpacing: "0.22em",
              pl: "0.22em",
              userSelect: "none",
              fontSize: 24,
            }}
          >
            İDA
          </Box>

          <Box
            sx={{
              width: 120,
              height: 1,
              mx: "auto",
              mt: 1.5,
              background:
                "linear-gradient(90deg, transparent, #C8A24A, transparent)",
            }}
          />
        </Box>

        {/* FORM KARTI */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            border: "1px solid #E5E7EB",
            bgcolor: "#fff",
            p: { xs: 2, sm: 3 },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
            Giriş
          </Typography>

          <Box sx={{ display: "grid", gap: 1.75, mt: 2.5 }}>
            {errorMessage && (
              <Alert severity="error" sx={{ borderRadius: 1.25 }}>
                {errorMessage}
              </Alert>
            )}

            <TextField
              label="E-posta"
              variant="outlined"
              fullWidth
              value={userInfo.email}
              onChange={handleEmailChange}
              autoComplete="email"
              // Mobil klavyede @ görünmesi için:
              type="email"
              inputProps={{
                inputMode: "email",
                autoCapitalize: "none", // iOS/Android otomatik büyük harfi kapatır
                autoCorrect: "off",
                spellCheck: "false",
              }}
            />

            <FormControl variant="outlined" fullWidth>
              <InputLabel>Şifre</InputLabel>
              <OutlinedInput
                type={showPassword ? "text" : "password"}
                value={userInfo.password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Şifre"
              />
            </FormControl>

            <Button
              size="large"
              variant="contained"
              disabled={loading}
              onClick={handleSubmit}
              sx={{
                mt: 0.75,
                borderRadius: 1.25,
                py: 1.5,
                fontWeight: 700,
                bgcolor: "#111827",
                "&:hover": { bgcolor: "#0b1220" },
              }}
            >
              {loading ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
            </Button>

            <Box sx={{ mt: 0.75, textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
              © {year} Ayvalık İDA Muhterem Locası
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default SignIn;
