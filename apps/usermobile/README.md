# User Mobile App

This folder contains the code for the mobile version of the user application.

**_All commands should be ran from the platform directory_**

## Building

Before doing any of the following you should `npm i` in the platform directory.

Run `npx nx run usermobile:prebuild` to construct the ios and android directories.

### iOS

_A Mac with at least MacOS 14.5 with xcode fully installed is required_

Open `Usermobile.xcworkspace` in the ios directory.

If debuging you can just press the run button in Xcode. This will build and load the app on your phone and show changes in real time. However, this requires the computer to be running the app and the app will not work on its own.

If you wish to install the app on the phone and be able to use it while not connected to the computer then you need to change to a release build. This can be done in `Product > Scheme > Edit Scheme`. In the run section change it to release.

The above requires an Apple Developer Program membership ($100 a year) to build as you have to sign the application. When you press run in Xcode after switching to release it will load like debug and allow you to debug but when you kill the application it will remain on your phone and work without the computer.

### Android

_This should work on any system, but mileage may vary_

cd into the android directory and run `./gradlew app:assemble:Release`

This will build the .apk required for android devices and (like ios) will make the app remain on the phone. However there will be no debug session on the first run.

After the build finishes the result is locations in `android/app/build/outputs/apk/release/app-release.apk`

To load this apk onto the phone run `adb -d install app/build/outputs/apk/release/app-release.apk` from the android folder
