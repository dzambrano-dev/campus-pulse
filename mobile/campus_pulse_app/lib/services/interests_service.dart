import 'api_client.dart';

class InterestsService {
  InterestsService({
    ApiClient? apiClient,
  }) : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  Future<List<String>> fetchInterests() async {
    try {
      final data = await _apiClient.get('/get-interests');

      final rawInterests = data is Map<String, dynamic>
          ? data['interests']
          : data;

      if (rawInterests is! List) {
        return demoInterests();
      }

      return rawInterests.map((interest) => interest.toString()).toList();
    } catch (_) {
      return demoInterests();
    }
  }

  // Compatibility name used by CreateEventScreen and InterestsScreen.
  Future<List<String>> fetchAvailableInterests() async {
    return fetchInterests();
  }

  Future<void> updateInterests(List<String> interests) async {
    await _apiClient.post(
      '/update-interests',
      body: {
        'interests': interests,
      },
    );
  }

  List<String> demoInterests() {
    return const [
      'academics',
      'ai',
      'athletics',
      'career',
      'club',
      'food',
      'gaming',
      'music',
      'social',
      'sports',
      'study',
      'technology',
    ];
  }

  // Compatibility name used by CreateEventScreen and InterestsScreen.
  List<String> demoAvailableInterests() {
    return demoInterests();
  }
}