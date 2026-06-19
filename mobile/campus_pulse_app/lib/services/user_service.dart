import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/app_user.dart';
import '../utils/constants.dart';

class UserService {
  Future<AppUser> fetchUserById(String userId) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/get-user?id=$userId');

    final response = await http.get(
      uri,
      headers: {
        'Accept': 'application/json',
      },
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to load profile');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return AppUser.fromJson(data);
  }

  Future<AppUser> fetchCurrentUser() async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/user');

    final response = await http.get(
      uri,
      headers: {
        'Accept': 'application/json',
      },
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to load current user');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return AppUser.fromJson(data);
  }

  Future<String> updateUsername(String username) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/update-username');

    final response = await http.post(
      uri,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'username': username,
      }),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(data['error']?.toString() ?? 'Failed to update username');
    }

    return data['username']?.toString() ?? username;
  }

  Future<String> updateAvatar(String avatarBase64WebP) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/update-avatar');

    final response = await http.post(
      uri,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'avatar': avatarBase64WebP,
      }),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(data['error']?.toString() ?? 'Failed to update avatar');
    }

    return data['avatar']?.toString() ?? '';
  }

  Future<AppUser> toggleOrganizer(String userId) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/toggle-organizer');

    final response = await http.post(
      uri,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'id': userId,
      }),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(data['error']?.toString() ?? 'Failed to update role');
    }

    return AppUser.fromJson(data);
  }

  AppUser demoCurrentUser() {
    return const AppUser(
      id: '1',
      username: 'campuspulse',
      role: 'admin',
      avatar: null,
      interests: [
        'AI',
        'Computer Science',
        'Clubs',
        'Career',
      ],
    );
  }
}