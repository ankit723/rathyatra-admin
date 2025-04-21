# Mobile App Files Directory

This directory is intended for storing the mobile application files that can be downloaded from the admin dashboard.

## Required Files

Please place the following files in this directory:

1. `rathyatra-app.apk` - The Android application package
2. `rathyatra-app.ipa` - The iOS application package

## How It Works

The admin dashboard includes QR codes and direct download links for these applications. When a user scans the QR code or clicks the download button, they will be directed to download these files.

## Important Notes

- iOS IPA files can only be installed on iOS devices if they are properly signed with either:
  - An Apple Developer certificate for App Store distribution
  - An Ad Hoc distribution certificate for specific registered devices
  - An Enterprise certificate for in-house distribution

- For testing purposes, you may need to use alternative distribution methods for iOS, such as TestFlight.

- Android APK files can be installed directly if the user enables "Install from Unknown Sources" in their device settings.

## Security Considerations

Ensure that the application files are properly signed and verified before placing them in this public directory, as they will be accessible to anyone with access to the admin dashboard. 