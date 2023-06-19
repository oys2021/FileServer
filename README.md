# File Server Application

This is a file server application that allows users to upload, download, search, and preview files. It also provides email functionality to send files through the platform. The application has separate features for both customers and administrators.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Routes](#routes)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Features

### Customer Requirements

1. **Signup & Login**: Users can sign up and log in using their email and password. Account verification is required. The application also provides a reset password feature for recovering lost passwords.

2. **Feed Page**: Users can access a feed page that displays a list of downloadable files.

3. **Search**: Users can search the file server to find specific files.

4. **Preview Files**: The application supports previewing files such as PDF, images, audio, and videos.

5. **Send Files**: Users can send files to an email address through the platform.

### Admin Requirements

1. **File Upload**: Administrators can upload files to the server. Each file should have a title and description.

2. **Statistics**: Admins can view the number of downloads and the number of emails sent for each file.

## Prerequisites

Before running the application, ensure you have the following prerequisites:

- Node.js (version X.X.X)
- MongoDB (version X.X.X)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/oys2021/FileServer.git

2.
Navigate to the project directory:
cd file-server

3.Install the dependencies:
npm install

## Configuration
1. Create a .env file in the project root directory.

## Routes
There are 3 main routes
1.home ('/')

2.admin ('/admin') 
-'admin/addfile': for uploading files by admin
-'admin/main': for admn to view number of downloads and number of email sent
3.users ('/users')
-'user/signup' to register users
-'user/login'  to login users
where there are further routes for each.

## Usage
Start the application:
npm start



