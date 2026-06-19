import 'dart:convert';
import 'package:http/http.dart' as http;

import '../utils/constants.dart';

class InterestsService {
  Future<List<String>> fetchAvailableInterests() async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/get-interests');

    final response = await http.get(
      uri,
      headers: {
        'Accept': 'application/json',
      },
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to load interests');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final interests = data['interests'];

    if (interests is! List) {
      return [];
    }

    return interests.map((item) => item.toString()).toList();
  }

  Future<void> updateInterests(List<String> interests) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/update-interests');

    final response = await http.post(
      uri,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'interests': interests,
      }),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final data = jsonDecode(response.body);
      final message = data is Map<String, dynamic>
          ? data['error']?.toString()
          : null;

      throw Exception(message ?? 'Failed to update interests');
    }
  }

  List<String> demoAvailableInterests() {
    return [
      'academics',
      'ai',
      'computer science',
      'cybersecurity',
      'career',
      'clubs',
      'social',
      'athletics',
      'music',
      'art',
      'gaming',
      'volunteering',
    ];
  }
}