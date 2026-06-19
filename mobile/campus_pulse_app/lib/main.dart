import 'package:flutter/material.dart';

import 'screens/login_screen.dart';
import 'widgets/app_shell.dart';

void main() {
  runApp(const CampusPulseApp());
}

class CampusPulseApp extends StatefulWidget {
  const CampusPulseApp({super.key});

  @override
  State<CampusPulseApp> createState() => _CampusPulseAppState();
}

class _CampusPulseAppState extends State<CampusPulseApp> {
  bool _isDarkMode = false;
  bool _isLoggedIn = false;

  void _handleLogin() {
    setState(() {
      _isLoggedIn = true;
    });
  }

  void _handleLogout() {
    setState(() {
      _isLoggedIn = false;
    });
  }

  void _toggleTheme() {
    setState(() {
      _isDarkMode = !_isDarkMode;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Campus Pulse',
      debugShowCheckedModeBanner: false,
      themeMode: _isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.indigo,
        brightness: Brightness.light,
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.indigo,
        brightness: Brightness.dark,
      ),
      home: _isLoggedIn
          ? AppShell(
              onLogout: _handleLogout,
              onToggleTheme: _toggleTheme,
              isDarkMode: _isDarkMode,
            )
          : LoginScreen(
              onLoginSuccess: _handleLogin,
            ),
    );
  }
}