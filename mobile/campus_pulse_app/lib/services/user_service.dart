import '../models/app_user.dart';
import 'api_client.dart';

class UserService {
  UserService({
    ApiClient? apiClient,
  }) : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  Future<AppUser> fetchCurrentUser() async {
    try {
      final data = await _apiClient.get('/user');

      if (data is Map<String, dynamic>) {
        final userJson = data['user'] ?? data;
        return AppUser.fromJson(userJson);
      }

      return demoCurrentUser();
    } catch (_) {
      return demoCurrentUser();
    }
  }

  Future<AppUser?> fetchUserById(String userId) async {
    try {
      final data = await _apiClient.get(
        '/get-user',
        queryParameters: {
          'id': userId,
        },
      );

      if (data is Map<String, dynamic>) {
        final userJson = data['user'] ?? data;
        return AppUser.fromJson(userJson);
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  Future<String> updateUsername(String username) async {
    await _apiClient.post(
      '/update-username',
      body: {
        'username': username,
      },
    );

    return username;
  }

  Future<String> updateAvatar(String avatar) async {
    await _apiClient.post(
      '/update-avatar',
      body: {
        'avatar': avatar,
      },
    );

    return avatar;
  }

  Future<AppUser> toggleOrganizer(String userId) async {
    final data = await _apiClient.post(
      '/toggle-organizer',
      body: {
        'id': userId,
      },
    );

    if (data is Map<String, dynamic>) {
      final userJson = data['user'] ?? data;
      return AppUser.fromJson(userJson);
    }

    throw Exception('Failed to toggle organizer role');
  }

  AppUser demoCurrentUser() {
    return const AppUser(
      id: '1',
      username: 'campuspulse',
      role: 'admin',
      avatar: '',
      interests: [
        'academics',
        'ai',
        'career',
        'technology',
      ],
    );
  }
}