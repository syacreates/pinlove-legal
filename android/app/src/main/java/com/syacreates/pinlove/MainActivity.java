package com.syacreates.pinlove;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        rewriteShareIntent();
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onNewIntent(Intent intent) {
        setIntent(intent);
        rewriteShareIntent();
        super.onNewIntent(getIntent());
    }

    /**
     * Convertit un partage reçu depuis TikTok/Instagram (ACTION_SEND) en lien
     * profond pinlove://import?url=..., traité par le même appUrlOpen que sur iOS.
     */
    private void rewriteShareIntent() {
        Intent intent = getIntent();
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        if (!"text/plain".equals(intent.getType())) return;

        String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (sharedText == null || sharedText.trim().isEmpty()) return;

        Uri deepLink = Uri.parse("pinlove://import?url=" + Uri.encode(sharedText.trim()));
        setIntent(new Intent(Intent.ACTION_VIEW, deepLink));
    }
}
