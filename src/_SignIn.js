import { useState } from "react";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { useNavigate } from "react-router-dom";
import { signIn } from "./redux/requests";

const SignIn = () => {
  const [userInfo, setUserInfo] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#ffffff",
        padding: 24,
      }}
    >
      <div style={{ width: 420, maxWidth: "100%" }}>
        {/* ÜST KONSEPT */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div
            style={{
              width: 84,
              height: 44,
              margin: "0 auto",
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              border: "1px solid #E5E7EB",
              color: "#C8A24A",
              fontWeight: 700,
              letterSpacing: "0.22em",
              paddingLeft: "0.22em",
              userSelect: "none",
              fontSize: 24
            }}
          >
            İDA
          </div>

          <div
            style={{
              width: 120,
              height: 1,
              margin: "12px auto 0",
              background:
                "linear-gradient(90deg, transparent, #C8A24A, transparent)",
            }}
          />
        </div>

        {/* FORM KARTI */}
        <Paper
          elevation={0}
          style={{
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            padding: 24,
            background: "#ffffff",
          }}
        >
          <Typography
            variant="h6"
            style={{ fontWeight: 600, color: "#111827" }}
          >
            Giriş
          </Typography>


          <div style={{ display: "grid", gap: 14, marginTop: 22 }}>
            <TextField
              label="Kullanıcı Adı"
              variant="outlined"
              fullWidth
              value={userInfo.email}
              onChange={(e) =>
                setUserInfo({ ...userInfo, email: e.target.value })
              }
            />

            <FormControl variant="outlined" fullWidth>
              <InputLabel>Şifre</InputLabel>
              <OutlinedInput
                type={showPassword ? "text" : "password"}
                value={userInfo.password}
                onChange={(e) =>
                  setUserInfo({ ...userInfo, password: e.target.value })
                }
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
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
              onClick={() => {
                setLoading(true);
                signIn({
                  ...userInfo,
                  callback: (ok) => {
                    setLoading(false);
                    if (ok) navigate("/");
                  },
                });
              }}
              style={{
                marginTop: 6,
                borderRadius: 10,
                padding: "12px 14px",
                fontWeight: 700,
                background: "#111827",
              }}
            >
              {loading ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
            </Button>

            <div
              style={{
                marginTop: 6,
                textAlign: "center",
                fontSize: 12,
                color: "#9CA3AF",
              }}
            >
              © {new Date().getFullYear()} Ayvalık İDA Muhterem Locası
            </div>
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default SignIn;
