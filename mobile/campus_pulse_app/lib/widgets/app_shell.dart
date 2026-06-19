import 'package:flutter/material.dart';

import '../screens/create_event_screen.dart';
import '../screens/events_screen.dart';
import '../screens/map_screen.dart';
import '../screens/profile_screen.dart';

class AppShell extends StatefulWidget {
  final VoidCallback onLogout;
  final VoidCallback onToggleTheme;
  final bool isDarkMode;

  const AppShell({
    super.key,
    required this.onLogout,
    required this.onToggleTheme,
    required this.isDarkMode,
  });

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  late final List<Widget> _screens = [
    EventsScreen(
      onShowOnMap: (event) {
        setState(() {
          _selectedIndex = 1;
        });
      },
    ),
    MapScreen(isDarkMode: widget.isDarkMode),
    CreateEventScreen(isDarkMode: widget.isDarkMode),
    ProfileScreen(
      onLogout: widget.onLogout,
      onToggleTheme: widget.onToggleTheme,
      isDarkMode: widget.isDarkMode,
    ),
  ];

  final List<String> _titles = const [
    'Events',
    'Map',
    'Create',
    'Profile',
  ];

  void _selectScreen(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  void didUpdateWidget(covariant AppShell oldWidget) {
    super.didUpdateWidget(oldWidget);

    _screens[3] = ProfileScreen(
      onLogout: widget.onLogout,
      onToggleTheme: widget.onToggleTheme,
      isDarkMode: widget.isDarkMode,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_selectedIndex]),
        centerTitle: true,
      ),
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: _selectScreen,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.event),
            label: 'Events',
          ),
          NavigationDestination(
            icon: Icon(Icons.map),
            label: 'Map',
          ),
          NavigationDestination(
            icon: Icon(Icons.add_circle_outline),
            label: 'Create',
          ),
          NavigationDestination(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}