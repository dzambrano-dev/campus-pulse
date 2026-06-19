import 'package:flutter/material.dart';

import '../models/event.dart';
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
  CampusEvent? _selectedMapEvent;

  final List<String> _titles = const [
    'Events',
    'Map',
    'Create',
    'Profile',
  ];

  void _selectScreen(int index) {
    setState(() {
      _selectedIndex = index;

      // If user manually taps away from Map, clear the selected map target.
      if (index != 1) {
        _selectedMapEvent = null;
      }
    });
  }

  void _showEventOnMap(CampusEvent event) {
    setState(() {
      _selectedMapEvent = event;
      _selectedIndex = 1;
    });
  }

  List<Widget> get _screens {
    return [
      EventsScreen(
        onShowOnMap: _showEventOnMap,
      ),
      MapScreen(
        isDarkMode: widget.isDarkMode,
        selectedEvent: _selectedMapEvent,
      ),
      CreateEventScreen(
        isDarkMode: widget.isDarkMode,
      ),
      ProfileScreen(
        onLogout: widget.onLogout,
        onToggleTheme: widget.onToggleTheme,
        isDarkMode: widget.isDarkMode,
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final screens = _screens;

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_selectedIndex]),
        centerTitle: true,
      ),
      body: screens[_selectedIndex],
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