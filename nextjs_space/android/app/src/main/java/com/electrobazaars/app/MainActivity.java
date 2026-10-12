package com.electrobazaars.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.activity.OnBackPressedCallback;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1234;

    // JavaScript interface exposed to the Web App to request admin permissions on demand
    public class WebAppInterface {
        @JavascriptInterface
        public void requestAdminPermissions() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    requestAdminPermissionsInternal();
                }
            });
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Enforce NoActionBar theme and suppress title bar across all Android versions (7 to 16)
        setTheme(R.style.AppTheme_NoActionBar);
        try {
            supportRequestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
            if (getSupportActionBar() != null) {
                getSupportActionBar().hide();
            }
        } catch (Exception ignored) {}

        // Enable Edge-to-Edge for Android 15 (API 35+) and backward compatibility
        EdgeToEdge.enable(this);

        super.onCreate(savedInstanceState);

        // Ensure status bar icons are dark and crisp over the white header
        try {
            androidx.core.view.WindowInsetsControllerCompat insetsController =
                androidx.core.view.WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (insetsController != null) {
                insetsController.setAppearanceLightStatusBars(true);
            }
        } catch (Exception ignored) {}

        // NOTE: We DO NOT request permissions on app launch.
        // Customers browsing the store, adding to cart, or logging in will NOT be prompted for Camera or Files.
        // Permissions are only requested when an Admin logs in or visits an admin page.

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge != null) {
                    WebView webView = bridge.getWebView();
                    if (webView != null && webView.canGoBack()) {
                        webView.goBack();
                        return;
                    }
                }
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
                setEnabled(true);
            }
        });

        if (bridge != null) {
            WebView webView = bridge.getWebView();
            if (webView != null) {
                // Disable WebView overscroll bounce and wobbling like a website
                webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
                webView.setHorizontalScrollBarEnabled(false);
                webView.setVerticalScrollBarEnabled(false);

                // Enable Geolocation, DOM storage, Database and File Access in WebView settings
                webView.getSettings().setJavaScriptEnabled(true);
                webView.getSettings().setGeolocationEnabled(true);
                webView.getSettings().setDomStorageEnabled(true);
                webView.getSettings().setDatabaseEnabled(true);
                webView.getSettings().setAllowFileAccess(true);
                webView.getSettings().setAllowContentAccess(true);

                // Enable persistent cookies so user login is never lost on app close
                android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
                cookieManager.setAcceptCookie(true);
                cookieManager.setAcceptThirdPartyCookies(webView, true);
                cookieManager.flush();
                
                // Append Native App Version tag to UserAgent
                String ua = webView.getSettings().getUserAgentString();
                if (!ua.contains("HelloBazaarNativeAPK")) {
                    webView.getSettings().setUserAgentString(ua + " HelloBazaarNativeAPK/2.2.0");
                }

                // Register Javascript Interface so Web App can trigger Admin Permissions
                webView.addJavascriptInterface(new WebAppInterface(), "AndroidAdminBridge");

                // Inherit BridgeWebChromeClient so onShowFileChooser, Camera capture & File Picker work 100% across all pages
                webView.setWebChromeClient(new BridgeWebChromeClient(bridge) {
                    @Override
                    public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                        callback.invoke(origin, true, false);
                    }

                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        request.grant(request.getResources());
                    }
                });

                // Handle WhatsApp, APK Downloads, Intent, Tel, Mailto custom schemes, and detect /admin navigation
                webView.setWebViewClient(new BridgeWebViewClient(bridge) {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        if (request != null && request.getUrl() != null) {
                            String url = request.getUrl().toString();
                            if (url.startsWith("whatsapp:") || url.contains("wa.me") || url.contains("api.whatsapp.com") || url.startsWith("intent:") || url.startsWith("tel:") || url.startsWith("mailto:") || url.endsWith(".apk") || url.contains(".apk") || url.contains("app-release") || url.contains("electrobazaar.apk")) {
                                try {
                                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                                    startActivity(intent);
                                    return true;
                                } catch (Exception e) {
                                    e.printStackTrace();
                                }
                            }
                        }
                        return super.shouldOverrideUrlLoading(view, request);
                    }

                    @Override
                    public void onPageStarted(WebView view, String url, Bitmap favicon) {
                        super.onPageStarted(view, url, favicon);
                        // Trigger Camera and File permissions ONLY when visiting Admin pages
                        if (url != null && (url.contains("/admin") || url.contains("/dealer"))) {
                            requestAdminPermissionsInternal();
                        }
                    }

                    @Override
                    public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
                        super.doUpdateVisitedHistory(view, url, isReload);
                        if (url != null && (url.contains("/admin") || url.contains("/dealer"))) {
                            requestAdminPermissionsInternal();
                        }
                    }

                    @Override
                    public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                        super.onReceivedError(view, request, error);
                        if (request != null && request.isForMainFrame() && error != null && error.getErrorCode() == ERROR_HOST_LOOKUP) {
                            view.loadUrl("https://electrobazaars.com/offline.html");
                        }
                    }
                });

                // Handle file downloads
                webView.setDownloadListener(new DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                        try {
                            Intent intent = new Intent(Intent.ACTION_VIEW);
                            intent.setData(Uri.parse(url));
                            startActivity(intent);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                });
            }
        }
    }

    /**
     * Explicitly requests Camera permission.
     * This is only called when an Admin logs in or enters an Admin area.
     * File/Photo selection is handled securely via the Android system picker without broad storage permissions.
     */
    public void requestAdminPermissionsInternal() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        try {
            android.webkit.CookieManager.getInstance().flush();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        try {
            android.webkit.CookieManager.getInstance().flush();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
