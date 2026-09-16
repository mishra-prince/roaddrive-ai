#!/bin/sh
set -e
export ANDROID_HOME=/opt/android-sdk-linux
export GRADLE_USER_HOME=/tmp/gh
mkdir -p /tmp/gh/wrapper/dists/gradle-8.14.3-all/7a4c1120f593c4ea7061c3c331a0812b
cp /tmp/gz/gradle-8.14.3-all.zip /tmp/gh/wrapper/dists/gradle-8.14.3-all/7a4c1120f593c4ea7061c3c331a0812b/gradle-8.14.3-all.zip
BT=$(ls -d /opt/android-sdk-linux/build-tools/* | sort -V | tail -1)
# Commit451 android-arm-build-tools: aarch64 aapt2 (Releases asset, not repo tree)
curl -sL --max-time 120 -o /tmp/aapt2-arm64 \
  "https://github.com/Commit451/android-arm-build-tools/releases/download/platform-tools-37.0.0/aapt2"
chmod +x /tmp/aapt2-arm64
# verify it actually executes on aarch64 before swapping it in
if /tmp/aapt2-arm64 version >/tmp/aapt2-ver.txt 2>&1 && grep -q "Packaging" /tmp/aapt2-ver.txt; then
  cp /tmp/aapt2-arm64 "$BT/aapt2"
  echo "aapt2 swapped: $(/tmp/aapt2-arm64 version | head -1)"
else
  echo "FATAL: downloaded aapt2 not executable"; /tmp/aapt2-arm64 version; exit 1
fi
export GRADLE_OPTS="-Dorg.gradle.jvmargs=-Xmx1024m"
# point AGP's maven-aapt2 (used by AarResourcesCompilerTransform) at the arm64 binary
echo "android.aapt2FromMavenOverride=$BT/aapt2" >> /proj/android/gradle.properties
cd /proj/android
./gradlew -g /tmp/gh clean assembleDebug --no-daemon 2>&1 | tail -25
