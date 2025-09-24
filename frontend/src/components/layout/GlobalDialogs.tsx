import React, { Suspense } from 'react';

// Lazy load dialog components to reduce initial bundle size
const SessionTimeoutWarningDialog = React.lazy(() => import("../SessionTimeoutWarningDialog").then(m => ({ default: m.SessionTimeoutWarningDialog })));
const PrivacyPolicyDialog = React.lazy(() => import("../PrivacyPolicyDialog").then(m => ({ default: m.PrivacyPolicyDialog })));
const HelpDialog = React.lazy(() => import("../HelpDialog").then(m => ({ default: m.HelpDialog })));
const UserProfileDialog = React.lazy(() => import("../UserProfileDialog").then(m => ({ default: m.UserProfileDialog })));
const AuthManager = React.lazy(() => import("../auth").then(m => ({ default: m.AuthManager })));

// Legal dialog components (footer access)
const TermsOfServiceDialog = React.lazy(() => import("../LegalDialogs").then(m => ({ default: m.TermsOfServiceDialog })));
const PrivacyPolicyFooterDialog = React.lazy(() => import("../LegalDialogs").then(m => ({ default: m.PrivacyPolicyFooterDialog })));
const DMCAPolicyDialog = React.lazy(() => import("../LegalDialogs").then(m => ({ default: m.DMCAPolicyDialog })));
const LiabilityDisclaimerDialog = React.lazy(() => import("../LegalDialogs").then(m => ({ default: m.LiabilityDisclaimerDialog })));
const LegalAcceptanceDialog = React.lazy(() => import("../LegalDialogs").then(m => ({ default: m.LegalAcceptanceDialog })));

// Accessibility control panel
const AccessibilityControlPanel = React.lazy(() => import("../AccessibilityControlPanel").then(m => ({ default: m.AccessibilityControlPanel })));

interface GlobalDialogsProps {
  // Help dialog
  helpDialogOpen: boolean;
  onHelpDialogClose: () => void;

  // Privacy policy dialog
  privacyDialogForceShow: boolean;
  onPrivacyDialogAccepted: () => void;

  // Accessibility panel
  accessibilityPanelOpen: boolean;
  onAccessibilityPanelClose: () => void;

  // Auth manager
  loginOpen: boolean;
  registerOpen: boolean;
  onCloseLogin: () => void;
  onCloseRegister: () => void;
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;

  // Legal dialogs
  termsDialogOpen: boolean;
  onTermsDialogClose: () => void;
  dmcaDialogOpen: boolean;
  onDmcaDialogClose: () => void;
  disclaimerDialogOpen: boolean;
  onDisclaimerDialogClose: () => void;
  privacyFooterDialogOpen: boolean;
  onPrivacyFooterDialogClose: () => void;

  // Legal acceptance
  forceShowLegalAcceptance: boolean;
  onLegalAcceptanceAccepted: () => void;
}

export const GlobalDialogs: React.FC<GlobalDialogsProps> = ({
  helpDialogOpen,
  onHelpDialogClose,
  privacyDialogForceShow,
  onPrivacyDialogAccepted,
  accessibilityPanelOpen,
  onAccessibilityPanelClose,
  loginOpen,
  registerOpen,
  onCloseLogin,
  onCloseRegister,
  onSwitchToLogin,
  onSwitchToRegister,
  termsDialogOpen,
  onTermsDialogClose,
  dmcaDialogOpen,
  onDmcaDialogClose,
  disclaimerDialogOpen,
  onDisclaimerDialogClose,
  privacyFooterDialogOpen,
  onPrivacyFooterDialogClose,
  forceShowLegalAcceptance,
  onLegalAcceptanceAccepted,
}) => {
  return (
    <>
      {/* Global session timeout warning dialog */}
      <Suspense fallback={null}>
        <SessionTimeoutWarningDialog />
      </Suspense>

      {/* Help Dialog */}
      <Suspense fallback={null}>
        <HelpDialog
          open={helpDialogOpen}
          onClose={onHelpDialogClose}
        />
      </Suspense>

      {/* Privacy Policy Dialog */}
      <Suspense fallback={null}>
        <PrivacyPolicyDialog
          forceShow={privacyDialogForceShow}
          onAccepted={onPrivacyDialogAccepted}
        />
      </Suspense>

      {/* User Profile Dialog */}
      <Suspense fallback={null}>
        <UserProfileDialog />
      </Suspense>

      {/* Authentication Manager */}
      <Suspense fallback={null}>
        <AuthManager
          loginOpen={loginOpen}
          registerOpen={registerOpen}
          onCloseLogin={onCloseLogin}
          onCloseRegister={onCloseRegister}
          onSwitchToLogin={onSwitchToLogin}
          onSwitchToRegister={onSwitchToRegister}
        />
      </Suspense>

      {/* Accessibility Control Panel */}
      <Suspense fallback={null}>
        <AccessibilityControlPanel
          open={accessibilityPanelOpen}
          onClose={onAccessibilityPanelClose}
        />
      </Suspense>

      {/* Legal Dialogs - Terms of Service */}
      <Suspense fallback={null}>
        <TermsOfServiceDialog
          open={termsDialogOpen}
          onClose={onTermsDialogClose}
        />
      </Suspense>

      {/* Legal Dialogs - Privacy Policy (Footer) */}
      <Suspense fallback={null}>
        <PrivacyPolicyFooterDialog
          open={privacyFooterDialogOpen}
          onClose={onPrivacyFooterDialogClose}
        />
      </Suspense>

      {/* Legal Dialogs - DMCA Policy */}
      <Suspense fallback={null}>
        <DMCAPolicyDialog
          open={dmcaDialogOpen}
          onClose={onDmcaDialogClose}
        />
      </Suspense>

      {/* Legal Dialogs - Liability Disclaimer */}
      <Suspense fallback={null}>
        <LiabilityDisclaimerDialog
          open={disclaimerDialogOpen}
          onClose={onDisclaimerDialogClose}
        />
      </Suspense>

      {/* Legal Acceptance Dialog - First-time user */}
      <Suspense fallback={null}>
        <LegalAcceptanceDialog
          forceShow={forceShowLegalAcceptance}
          onAccepted={onLegalAcceptanceAccepted}
        />
      </Suspense>
    </>
  );
};