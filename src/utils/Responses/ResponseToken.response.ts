export class TokenResponse {
  private token: string;
  private refresh: string;

  constructor(token: string, refresh: string) {
    this.token = token;
    this.refresh = refresh;
  }

  public showTokens() {
    return {
      token: this.token,
      refreshToken: this.refresh, // <-- chave no padrão desejado
    };
  }
}
