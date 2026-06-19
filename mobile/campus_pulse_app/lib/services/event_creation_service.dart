import 'api_client.dart';

class EventCreationService {
  EventCreationService({
    ApiClient? apiClient,
  }) : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  Future<void> createEvent(Map<String, dynamic> eventObject) async {
    await _apiClient.post(
      '/create-event',
      body: eventObject,
    );
  }
}