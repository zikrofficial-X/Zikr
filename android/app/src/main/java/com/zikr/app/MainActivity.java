package com.zikr.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import com.capacitorjs.plugins.browser.BrowserPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Explicitly register the official Capacitor Browser plugin before the
        // bridge is created. This prevents the native Android runtime from
        // falling back to the WebPlugin implementation and showing
        // "Browser plugin is not implemented on android".
        registerPlugin(BrowserPlugin.class);
        super.onCreate(savedInstanceState);

        if (getBridge() == null) {
            return;
        }

        WebView webView = getBridge().getWebView();
        webView.setNestedScrollingEnabled(true);
        webView.setVerticalScrollBarEnabled(true);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
        webView.setVerticalFadingEdgeEnabled(false);
    }
}
