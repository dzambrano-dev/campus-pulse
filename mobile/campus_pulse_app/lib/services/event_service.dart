import '../models/event.dart';
import 'api_client.dart';

class EventService {
  EventService({
    ApiClient? apiClient,
  }) : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  Future<List<CampusEvent>> fetchEvents() async {
    try {
      final data = await _apiClient.get('/get-events');

      final rawEvents = data is Map<String, dynamic>
          ? data['events']
          : data;

      if (rawEvents is! List) {
        return demoEvents();
      }

      return rawEvents
          .map((eventJson) => CampusEvent.fromJson(eventJson))
          .toList();
    } catch (_) {
      return demoEvents();
    }
  }

  Future<CampusEvent?> fetchEventById(String eventId) async {
    try {
      final data = await _apiClient.get(
        '/get-event',
        queryParameters: {
          'id': eventId,
        },
      );

      if (data is Map<String, dynamic>) {
        final eventJson = data['event'] ?? data;
        return CampusEvent.fromJson(eventJson);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> deleteEvent(String eventId) async {
    await _apiClient.delete(
      '/delete-event',
      queryParameters: {
        'id': eventId,
      },
    );
  }

  List<CampusEvent> demoEvents() {
    return [
      CampusEvent(
        id: 'demo-1',
        title: 'AI Study Session',
        type: 'academics',
        image: '',
        datetime: DateTime.now().add(const Duration(days: 1)).millisecondsSinceEpoch ~/ 1000,
        location: 'CSULB Library',
        createdBy: '1',
        createdByUsername: 'campuspulse',
        description:
            'Join students for a focused AI study session covering search algorithms, probability, and minimax.',
        tags: const ['academics', 'ai', 'study'],
        action: 'custom',
        actionLabel: 'Learn More',
        actionLink: 'https://www.csulb.edu',
        lat: 33.7772,
        lng: -118.1140,
      ),
      CampusEvent(
        id: 'demo-2',
        title: 'Beach Volleyball Meetup',
        type: 'athletics',
        image: '',
        datetime: DateTime.now().add(const Duration(days: 2)).millisecondsSinceEpoch ~/ 1000,
        location: 'Student Recreation Center',
        createdBy: '2',
        createdByUsername: 'beachsports',
        description:
            'Casual volleyball meetup for students. No experience needed. Bring water and comfortable shoes.',
        tags: const ['athletics', 'social'],
        action: 'rsvp',
        actionLabel: 'RSVP',
        actionLink: '',
        lat: 33.7851,
        lng: -118.1099,
      ),
      CampusEvent(
        id: 'demo-3',
        title: 'Career Fair Prep',
        type: 'career',
        image: '',
        datetime: DateTime.now().add(const Duration(days: 4)).millisecondsSinceEpoch ~/ 1000,
        location: 'Career Development Center',
        createdBy: '3',
        createdByUsername: 'careercenter',
        description:
            'Resume review, elevator pitch practice, and tips for talking to recruiters at upcoming career fairs.',
        tags: const ['career', 'resume'],
        action: 'contact',
        actionLabel: 'Contact',
        actionLink: 'careercenter@csulb.edu',
        lat: 33.7816,
        lng: -118.1127,
      ),
    ];
  }
}