package com.zikr.app;

import android.content.Intent;
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
        // falling back to the WebPlugin implementation.
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

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // MainActivity uses singleTask. OAuth deep links therefore arrive here
        // instead of recreating the Activity. Keep the latest intent attached
        // to the Activity so Capacitor's App plugin can surface appUrlOpen.
        setIntent(intent);
    }
}
