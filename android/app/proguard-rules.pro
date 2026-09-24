# Proguard rules for Server Dashboard
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-keep class space.ictevents.dashboard.models.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**
