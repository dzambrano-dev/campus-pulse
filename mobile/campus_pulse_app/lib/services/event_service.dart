import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/event.dart';
import '../utils/constants.dart';

class EventService {
  Future<List<CampusEvent>> fetchEvents() async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/get-events');

    final response = await http.get(
      uri,
      headers: {
        'Accept': 'application/json',
      },
    );

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Failed to load events');
    }

    final decoded = jsonDecode(response.body);

    final List<dynamic> rawEvents;

    if (decoded is Map<String, dynamic> && decoded['events'] is List) {
      rawEvents = decoded['events'] as List<dynamic>;
    } else if (decoded is List) {
      rawEvents = decoded;
    } else {
      rawEvents = [];
    }

    return rawEvents
        .whereType<Map<String, dynamic>>()
        .map(CampusEvent.fromJson)
        .toList();
  }

  List<CampusEvent> demoEvents() {
    final now = DateTime.now();

    return [
      CampusEvent(
        id: 'demo-1',
        title: 'AI Study Session',
        type: 'academics',
        image: null,
        datetime: now.add(const Duration(days: 1, hours: 2)).millisecondsSinceEpoch ~/ 1000,
        location: 'CSULB Library',
        createdBy: '1',
        createdByUsername: 'campuspulse',
        description:
            'Join other students for an AI study session covering search, probability, minimax, and machine learning basics.',
        tags: ['ai', 'study', 'computer science'],
        action: 'custom',
        actionLabel: 'View Info',
        actionLink: 'https://www.csulb.edu/',
        lat: 33.7772,
        lng: -118.1140,
      ),
      CampusEvent(
        id: 'demo-2',
        title: 'Campus Club Mixer',
        type: 'social',
        image: null,
        datetime: now.add(const Duration(days: 3, hours: 5)).millisecondsSinceEpoch ~/ 1000,
        location: 'Student Union',
        createdBy: '2',
        createdByUsername: 'studentlife',
        description:
            'Meet different clubs, find organizations that match your interests, and connect with students around campus.',
        tags: ['clubs', 'social', 'networking'],
        lat: 33.7814,
        lng: -118.1125,
      ),
    ];
  }
}