USE carbon_db;
UPDATE users SET password = '$2b$12$67R6njywNPn7opJnXC4bg.llzXfhB6eOKlPg0ZQGwhXm3Ki010DmtG' WHERE username = 'admin';
FLUSH PRIVILEGES;
