/** Authenticator-app setup instructions: QR code plus the key for manual entry. */
export function TotpQr({ qr, secret }: { qr: string; secret: string }) {
  return (
    <div className="space-y-3 text-sm">
      <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
        <li>
          Open your authenticator app (Google Authenticator, Microsoft Authenticator or Authy) and choose{" "}
          <em>Add account → Scan QR code</em>.
        </li>
        <li>Scan this code, then enter the 6-digit number the app shows.</li>
      </ol>
      <img src={qr} alt="Authenticator QR code" className="mx-auto h-44 w-44 bg-white p-2 border border-line" />
      <p className="text-xs text-muted-foreground text-center">
        Can't scan? Enter this key manually:
        <code className="mt-1 block break-all font-mono text-foreground select-all">{secret}</code>
      </p>
    </div>
  );
}
