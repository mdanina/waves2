import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  registerSchema,
  loginSchema,
  profileSchema,
  familyMemberSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './schemas';

describe('emailSchema', () => {
  it('should accept valid email', () => {
    expect(emailSchema.safeParse('user@example.com').success).toBe(true);
    expect(emailSchema.safeParse('test.email@domain.org').success).toBe(true);
    expect(emailSchema.safeParse('name+tag@gmail.com').success).toBe(true);
  });

  it('should reject invalid email formats', () => {
    expect(emailSchema.safeParse('notanemail').success).toBe(false);
    expect(emailSchema.safeParse('missing@domain').success).toBe(false);
    expect(emailSchema.safeParse('@nodomain.com').success).toBe(false);
    expect(emailSchema.safeParse('spaces in@email.com').success).toBe(false);
  });

  it('should reject empty email', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email обязателен');
    }
  });

  it('should provide proper error message for invalid email', () => {
    const result = emailSchema.safeParse('invalid');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Некорректный email');
    }
  });
});

describe('passwordSchema', () => {
  it('should accept valid passwords', () => {
    expect(passwordSchema.safeParse('123456').success).toBe(true);
    expect(passwordSchema.safeParse('password123').success).toBe(true);
    expect(passwordSchema.safeParse('Secure@Pass!').success).toBe(true);
    expect(passwordSchema.safeParse('пароль123').success).toBe(true);
  });

  it('should reject passwords shorter than 6 characters', () => {
    const result = passwordSchema.safeParse('12345');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('6');
    }
  });

  it('should reject passwords longer than 100 characters', () => {
    const longPassword = 'a'.repeat(101);
    const result = passwordSchema.safeParse(longPassword);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Пароль слишком длинный');
    }
  });

  it('should accept password with exactly 6 characters', () => {
    expect(passwordSchema.safeParse('123456').success).toBe(true);
  });

  it('should accept password with exactly 100 characters', () => {
    const password100 = 'a'.repeat(100);
    expect(passwordSchema.safeParse(password100).success).toBe(true);
  });
});

describe('phoneSchema', () => {
  it('should accept valid phone numbers', () => {
    expect(phoneSchema.safeParse('+79001234567').success).toBe(true);
    expect(phoneSchema.safeParse('79001234567').success).toBe(true);
    expect(phoneSchema.safeParse('+1234567890123456').success).toBe(false); // too long
  });

  it('should accept empty string (optional)', () => {
    expect(phoneSchema.safeParse('').success).toBe(true);
  });

  it('should accept undefined (optional)', () => {
    expect(phoneSchema.safeParse(undefined).success).toBe(true);
  });

  it('should reject invalid phone formats', () => {
    expect(phoneSchema.safeParse('not a phone').success).toBe(false);
    expect(phoneSchema.safeParse('123-456-7890').success).toBe(false);
    expect(phoneSchema.safeParse('+0123456789').success).toBe(false); // starts with 0
  });

  it('should accept international format', () => {
    expect(phoneSchema.safeParse('+442071234567').success).toBe(true);
    expect(phoneSchema.safeParse('+861234567890').success).toBe(true);
  });
});

describe('registerSchema', () => {
  const validData = {
    email: 'user@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('should accept valid registration data', () => {
    expect(registerSchema.safeParse(validData).success).toBe(true);
  });

  it('should reject mismatched passwords', () => {
    const data = { ...validData, confirmPassword: 'different' };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(i => i.path.includes('confirmPassword'));
      expect(confirmError?.message).toBe('Пароли не совпадают');
    }
  });

  it('should reject invalid email', () => {
    const data = { ...validData, email: 'invalid' };
    expect(registerSchema.safeParse(data).success).toBe(false);
  });

  it('should reject short password', () => {
    const data = { ...validData, password: '123', confirmPassword: '123' };
    expect(registerSchema.safeParse(data).success).toBe(false);
  });

  it('should reject empty confirm password', () => {
    const data = { ...validData, confirmPassword: '' };
    const result = registerSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(i => i.path.includes('confirmPassword'));
      expect(confirmError?.message).toBe('Подтверждение пароля обязательно');
    }
  });
});

describe('loginSchema', () => {
  it('should accept valid login data', () => {
    const data = { email: 'user@example.com', password: 'mypassword' };
    expect(loginSchema.safeParse(data).success).toBe(true);
  });

  it('should reject empty password', () => {
    const data = { email: 'user@example.com', password: '' };
    const result = loginSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Пароль обязателен');
    }
  });

  it('should reject invalid email', () => {
    const data = { email: 'notvalid', password: 'password' };
    expect(loginSchema.safeParse(data).success).toBe(false);
  });

  it('should accept any length password (login does not validate length)', () => {
    // Login only checks if password is not empty, not the length
    const data = { email: 'user@example.com', password: 'x' };
    expect(loginSchema.safeParse(data).success).toBe(true);
  });
});

describe('profileSchema', () => {
  it('should accept valid profile data', () => {
    const data = {
      firstName: 'Иван',
      lastName: 'Иванов',
      phone: '+79001234567',
      region: 'Москва',
    };
    expect(profileSchema.safeParse(data).success).toBe(true);
  });

  it('should require firstName', () => {
    const data = { firstName: '' };
    const result = profileSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Имя обязательно');
    }
  });

  it('should reject firstName longer than 100 characters', () => {
    const data = { firstName: 'a'.repeat(101) };
    const result = profileSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Имя слишком длинное');
    }
  });

  it('should accept optional lastName', () => {
    const data = { firstName: 'Иван' };
    expect(profileSchema.safeParse(data).success).toBe(true);
  });

  it('should reject lastName longer than 100 characters', () => {
    const data = { firstName: 'Иван', lastName: 'a'.repeat(101) };
    const result = profileSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const lastNameError = result.error.issues.find(i => i.path.includes('lastName'));
      expect(lastNameError?.message).toBe('Фамилия слишком длинная');
    }
  });

  it('should accept Cyrillic names', () => {
    const data = {
      firstName: 'Александр',
      lastName: 'Петров-Сидоров',
    };
    expect(profileSchema.safeParse(data).success).toBe(true);
  });
});

describe('familyMemberSchema', () => {
  const validMember = {
    firstName: 'Мария',
    relationship: 'child' as const,
  };

  it('should accept valid family member data', () => {
    expect(familyMemberSchema.safeParse(validMember).success).toBe(true);
  });

  it('should require firstName', () => {
    const data = { ...validMember, firstName: '' };
    const result = familyMemberSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should accept all valid relationships', () => {
    const relationships = ['parent', 'child', 'partner', 'sibling', 'caregiver', 'other'];
    relationships.forEach(rel => {
      const data = { firstName: 'Тест', relationship: rel };
      expect(familyMemberSchema.safeParse(data).success).toBe(true);
    });
  });

  it('should reject invalid relationship', () => {
    const data = { firstName: 'Тест', relationship: 'invalid' };
    const result = familyMemberSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Выберите тип отношения');
    }
  });

  it('should accept optional dateOfBirth', () => {
    const data = { ...validMember, dateOfBirth: '2010-05-15' };
    expect(familyMemberSchema.safeParse(data).success).toBe(true);
  });

  it('should accept valid genders', () => {
    const genders = ['male', 'female', 'other'];
    genders.forEach(gender => {
      const data = { ...validMember, gender };
      expect(familyMemberSchema.safeParse(data).success).toBe(true);
    });
  });

  it('should accept optional pronouns', () => {
    const data = { ...validMember, pronouns: 'он/его' };
    expect(familyMemberSchema.safeParse(data).success).toBe(true);
  });

  it('should reject pronouns longer than 50 characters', () => {
    const data = { ...validMember, pronouns: 'a'.repeat(51) };
    expect(familyMemberSchema.safeParse(data).success).toBe(false);
  });
});

describe('forgotPasswordSchema', () => {
  it('should accept valid email', () => {
    const data = { email: 'user@example.com' };
    expect(forgotPasswordSchema.safeParse(data).success).toBe(true);
  });

  it('should reject invalid email', () => {
    const data = { email: 'notvalid' };
    expect(forgotPasswordSchema.safeParse(data).success).toBe(false);
  });

  it('should reject empty email', () => {
    const data = { email: '' };
    expect(forgotPasswordSchema.safeParse(data).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('should accept valid reset password data', () => {
    const data = { password: 'newpassword123', confirmPassword: 'newpassword123' };
    expect(resetPasswordSchema.safeParse(data).success).toBe(true);
  });

  it('should reject mismatched passwords', () => {
    const data = { password: 'newpassword123', confirmPassword: 'different' };
    const result = resetPasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(i => i.path.includes('confirmPassword'));
      expect(confirmError?.message).toBe('Пароли не совпадают');
    }
  });

  it('should reject short password', () => {
    const data = { password: '123', confirmPassword: '123' };
    expect(resetPasswordSchema.safeParse(data).success).toBe(false);
  });

  it('should reject empty confirm password', () => {
    const data = { password: 'password123', confirmPassword: '' };
    const result = resetPasswordSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

describe('schema edge cases', () => {
  it('should handle whitespace in email', () => {
    expect(emailSchema.safeParse(' user@example.com ').success).toBe(false);
    expect(emailSchema.safeParse('user @example.com').success).toBe(false);
  });

  it('should handle unicode in password', () => {
    expect(passwordSchema.safeParse('пароль123').success).toBe(true);
    expect(passwordSchema.safeParse('密码123456').success).toBe(true);
  });

  it('should handle special characters in names', () => {
    const data = { firstName: "Жан-Клод", lastName: "О'Коннор" };
    expect(profileSchema.safeParse(data).success).toBe(true);
  });
});
