import 'dart:convert';
import 'package:http/http.dart' as http;

import '../utils/constants.dart';

class EventCreationService {
  Future<void> createEvent(Map<String, dynamic> eventData) async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/create-event');

    final response = await http.post(
      uri,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(eventData),
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final data = jsonDecode(response.body);
      final message = data is Map<String, dynamic>
          ? data['error']?.toString()
          : null;

      throw Exception(message ?? 'Failed to create event');
    }
  }
}