import 'dart:convert';
import 'package:http/http.dart' as http;

import '../utils/constants.dart';

class ApiClient {
  String? _authToken;
  String? _cookie;

  void setAuthToken(String token) {
    _authToken = token;
  }

  void setCookie(String cookie) {
    _cookie = cookie;
  }

  void clearAuth() {
    _authToken = null;
    _cookie = null;
  }

  Map<String, String> _headers({
    bool jsonBody = false,
  }) {
    final headers = <String, String>{
      'Accept': 'application/json',
    };

    if (jsonBody) {
      headers['Content-Type'] = 'application/json';
    }

    // Future Josh auth support:
    // If Cloudflare returns JWT/token, use this.
    if (_authToken != null) {
      headers['Authorization'] = 'Bearer $_authToken';
    }

    // If Cloudflare keeps cookie sessions, use this instead.
    if (_cookie != null) {
      headers['Cookie'] = _cookie!;
    }

    return headers;
  }

  Uri _uri(String path, [Map<String, String>? queryParameters]) {
    final cleanPath = path.startsWith('/') ? path : '/$path';

    final baseUri = Uri.parse('${AppConstants.apiBaseUrl}$cleanPath');

    if (queryParameters == null || queryParameters.isEmpty) {
      return baseUri;
    }

    return baseUri.replace(queryParameters: queryParameters);
  }

  Future<dynamic> get(
    String path, {
    Map<String, String>? queryParameters,
  }) async {
    final response = await http.get(
      _uri(path, queryParameters),
      headers: _headers(),
    );

    return _handleResponse(response);
  }

  Future<dynamic> post(
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final response = await http.post(
      _uri(path),
      headers: _headers(jsonBody: true),
      body: jsonEncode(body ?? {}),
    );

    return _handleResponse(response);
  }

  Future<dynamic> delete(
    String path, {
    Map<String, String>? queryParameters,
  }) async {
    final response = await http.delete(
      _uri(path, queryParameters),
      headers: _headers(),
    );

    return _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    final statusCode = response.statusCode;

    dynamic data;
    try {
      data = response.body.isEmpty ? null : jsonDecode(response.body);
    } catch (_) {
      data = null;
    }

    if (statusCode >= 200 && statusCode < 300) {
      return data;
    }

    String message = 'Request failed';

    if (data is Map<String, dynamic> && data['error'] != null) {
      message = data['error'].toString();
    }

    throw ApiException(
      message: message,
      statusCode: statusCode,
      data: data,
    );
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  final dynamic data;

  ApiException({
    required this.message,
    required this.statusCode,
    this.data,
  });

  @override
  String toString() {
    return 'ApiException($statusCode): $message';
  }
}