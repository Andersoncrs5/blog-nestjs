import * as bcrypt from 'bcrypt';

export class CryptoService {
  private static saltRounds = 16; 

  static async encrypt(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds); 
    const hashedPassword = await bcrypt.hash(password, salt); 
    return hashedPassword;
  }

  static async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  }
}