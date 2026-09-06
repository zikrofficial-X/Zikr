# ZIKR v1.3.2 Release CI Fix

The Android release pipeline uses JDK 21 because the Capacitor 7 Android build requires Java 21 at compile time.

Release targets Android 16 / API 36. The pipeline validates the signed APK, AAB, application ID, version name, target SDK, and SHA-256 checksums before publishing `v1.3.2`.
