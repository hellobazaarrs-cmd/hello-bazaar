# Project specific ProGuard / R8 rules for Electro Bazaar

# Preserve JavaScript interface methods for WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve Capacitor core and plugins
-keep public class com.getcapacitor.** { *; }
-keep class com.electrobazaars.app.** { *; }
-keepclassmembers class com.electrobazaars.app.MainActivity$WebAppInterface {
    public *;
}

# Preserve WebKit callbacks
-keepclassmembers class * extends android.webkit.WebChromeClient {
    public *;
}
-keepclassmembers class * extends android.webkit.WebViewClient {
    public *;
}

# Preserve line numbers and source files for Play Console crash reporting
-keepattributes SourceFile,LineNumberTable,*Annotation*

# Don't warn on missing optional third-party classes
-dontwarn com.google.android.gms.**
-dontwarn org.apache.cordova.**
-dontwarn androidx.**
