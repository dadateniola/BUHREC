-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `fullname` VARCHAR(255) NOT NULL,
    `role` ENUM('student', 'researcher', 'reviewer') NOT NULL,
    `degree` ENUM('msc', 'bsc', 'phd'),
    `course` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create the 'tasks' table
CREATE TABLE IF NOT EXISTS tasks (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT UNSIGNED NOT NULL,
    `reviewer_id` INT UNSIGNED,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES users(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`reviewer_id`) REFERENCES users(`id`) ON DELETE CASCADE
);

-- Create the 'activities' table
CREATE TABLE IF NOT EXISTS activities (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `task_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `type` ENUM('file', 'text') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`task_id`) REFERENCES tasks(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES users(`id`) ON DELETE CASCADE
);