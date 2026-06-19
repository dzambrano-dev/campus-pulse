import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/app_user.dart';
import '../utils/constants.dart';

class AuthService {
  Future<AppUser?> loadUser() async {
    try {
      final uri = Uri.parse('${AppConstants.apiBaseUrl}/user');

      final response = await http.get(
        uri,
        headers: {
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 401) {
        return null;
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        return null;
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return AppUser.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  Future<bool> checkSession() async {
    final user = await loadUser();
    return user != null;
  }

  Future<void> logout() async {
    try {
      final uri = Uri.parse('${AppConstants.apiBaseUrl}/logout');

      await http.post(
        uri,
        headers: {
          'Accept': 'application/json',
        },
      );
    } catch (_) {
      // Ignore logout errors for now.
    }
  }
}