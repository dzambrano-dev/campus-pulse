import 'package:flutter/material.dart';

import '../models/app_user.dart';
import '../services/user_service.dart';
import '../utils/constants.dart';

import 'interests_screen.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback onLogout;
  final VoidCallback onToggleTheme;
  final bool isDarkMode;

  const ProfileScreen({
    super.key,
    required this.onLogout,
    required this.onToggleTheme,
    required this.isDarkMode,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final UserService _userService = UserService();
  final TextEditingController _usernameController = TextEditingController();

  late Future<AppUser> _profileFuture;

  bool _isEditing = false;
  bool _isSaving = false;

  AppUser? _cachedUser;

  @override
  void initState() {
    super.initState();
    _profileFuture = _loadProfile();
  }

  Future<AppUser> _loadProfile() async {
    try {
      final user = await _userService.fetchCurrentUser();
      _cachedUser = user;
      _usernameController.text = user.username;
      return user;
    } catch (_) {
      final user = _userService.demoCurrentUser();
      _cachedUser = user;
      _usernameController.text = user.username;
      return user;
    }
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'organizer':
        return 'Organizer';
      default:
        return 'User';
    }
  }

  Color _roleColor(BuildContext context, String role) {
    switch (role) {
      case 'admin':
        return Colors.red;
      case 'organizer':
        return Colors.orange;
      default:
        return Theme.of(context).colorScheme.primary;
    }
  }

  String _avatarUrl(AppUser user) {
    if (user.avatar == null || user.avatar!.isEmpty) {
      return '';
    }

    return '${AppConstants.assetsBaseUrl}${user.avatar}';
  }

  Future<void> _saveProfile() async {
    final current = _cachedUser;
    if (current == null) return;

    final newUsername = _usernameController.text.trim();

    if (newUsername.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a username')),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      AppUser updated = current;

      if (newUsername != current.username) {
        final savedUsername = await _userService.updateUsername(newUsername);
        updated = updated.copyWith(username: savedUsername);
      }

      setState(() {
        _cachedUser = updated;
        _profileFuture = Future.value(updated);
        _isEditing = false;
      });
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile save failed. Using demo mode for now.'),
        ),
      );

      setState(() {
        _isEditing = false;
      });
    } finally {
      setState(() {
        _isSaving = false;
      });
    }
  }

  Future<void> _toggleOrganizer(AppUser user) async {
    try {
      final updated = await _userService.toggleOrganizer(user.id);

      setState(() {
        _cachedUser = updated;
        _profileFuture = Future.value(updated);
      });
    } catch (_) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Role update failed. Auth wiring comes later.'),
        ),
      );
    }
  }

  Future<void> _goToInterests() async {
    final current = _cachedUser;
    if (current == null) return;

    final updatedInterests = await Navigator.of(context).push<List<String>>(
      MaterialPageRoute(
        builder: (_) => InterestsScreen(
          initialInterests: current.interests,
        ),
      ),
    );

    if (updatedInterests == null) return;

    final updatedUser = current.copyWith(interests: updatedInterests);

    setState(() {
      _cachedUser = updatedUser;
      _profileFuture = Future.value(updatedUser);
    });
  }

  Widget _buildAvatar(BuildContext context, AppUser user) {
    final url = _avatarUrl(user);

    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        CircleAvatar(
          radius: 52,
          backgroundImage: url.isEmpty ? null : NetworkImage(url),
          child: url.isEmpty
              ? const Icon(
                  Icons.person,
                  size: 52,
                )
              : null,
        ),
        if (_isEditing)
          CircleAvatar(
            radius: 18,
            backgroundColor: Theme.of(context).colorScheme.primary,
            child: const Icon(
              Icons.camera_alt,
              color: Colors.white,
              size: 18,
            ),
          ),
      ],
    );
  }

  Widget _buildInterests(AppUser user) {
    if (_isEditing) {
      return OutlinedButton.icon(
        onPressed: _goToInterests,
        icon: const Icon(Icons.interests),
        label: const Text('Update Interests'),
      );
    }

    if (user.interests.isEmpty) {
      return const Text('No interests yet');
    }

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.center,
      children: user.interests.map((interest) {
        return Chip(label: Text(interest));
      }).toList(),
    );
  }

  Widget _buildProfile(AppUser user) {
    final roleColor = _roleColor(context, user.role);
    final isAdminViewing = _cachedUser?.role == 'admin';
    final profileIsAdmin = user.role == 'admin';
    final canToggleOrganizer = isAdminViewing && !profileIsAdmin;

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Center(child: _buildAvatar(context, user)),
        const SizedBox(height: 20),
        if (_isEditing)
          TextField(
            controller: _usernameController,
            textAlign: TextAlign.center,
            decoration: const InputDecoration(
              labelText: 'Username',
              border: OutlineInputBorder(),
            ),
          )
        else
          Text(
            '@${user.username}',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        const SizedBox(height: 10),
        Center(
          child: Chip(
            label: Text(_roleLabel(user.role)),
            labelStyle: const TextStyle(color: Colors.white),
            backgroundColor: roleColor,
          ),
        ),
        const SizedBox(height: 22),
        Center(child: _buildInterests(user)),
        const SizedBox(height: 32),
        SwitchListTile(
          title: const Text('Dark mode'),
          value: widget.isDarkMode,
          onChanged: (_) => widget.onToggleTheme(),
        ),
        const SizedBox(height: 12),
        FilledButton.icon(
          onPressed: _isSaving
              ? null
              : () {
                  if (_isEditing) {
                    _saveProfile();
                  } else {
                    setState(() {
                      _isEditing = true;
                    });
                  }
                },
          icon: Icon(_isEditing ? Icons.save : Icons.edit),
          label: Text(_isSaving
              ? 'Saving...'
              : _isEditing
                  ? 'Save Changes'
                  : 'Edit Profile'),
        ),
        const SizedBox(height: 12),
        if (canToggleOrganizer)
          OutlinedButton.icon(
            onPressed: () => _toggleOrganizer(user),
            icon: const Icon(Icons.admin_panel_settings),
            label: Text(
              user.role == 'organizer'
                  ? 'Remove Organizer'
                  : 'Make Organizer',
            ),
          ),
        const SizedBox(height: 12),
        OutlinedButton.icon(
          onPressed: widget.onLogout,
          icon: const Icon(Icons.logout),
          label: const Text('Log out'),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<AppUser>(
      future: _profileFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        final user = snapshot.data ?? _userService.demoCurrentUser();

        return _buildProfile(user);
      },
    );
  }
}