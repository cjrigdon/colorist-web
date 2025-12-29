import React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";

export default function Register() {
  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={0} square>
            <div className="register">
                <Avatar className="avatar">
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                Register
                    </Typography>
                <form noValidate>
                    <TextField
                        autoComplete="fname"
                        name="firstName"
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="firstName"
                        label="First Name"
                        autoFocus
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="lastName"
                        label="Last Name"
                        name="lastName"
                        autoComplete="lname"
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                    />
                    <FormControlLabel
                        control={<Checkbox value="allowExtraEmails" color="primary" />}
                        label="I want to receive inspiration, marketing promotions and updates via email."
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                    >
                        Sign Up
                    </Button>
                    <Grid container justify="flex-end">
                        <Grid item>
                        <Link href="/" variant="body2">
                            Already have an account? Sign in
                        </Link>
                        </Grid>
                    </Grid>
                </form>
            </div>
        </Grid>
    </Container>
  );
}