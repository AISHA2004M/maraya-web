import os
from datetime import datetime

EMAIL_LOG_PATH = "uploads/email_debug.log"


def log_email(recipient_email: str, subject: str, html_body: str):
    """
    Simulates sending a premium boutique email by writing it to the debug log.
    Creates the file and parent folders if they don't exist.
    """
    os.makedirs(os.path.dirname(EMAIL_LOG_PATH), exist_ok=True)
    
    divider = "=" * 80
    subdivider = "-" * 80
    timestamp = datetime.now().isoformat()
    
    log_entry = (
        f"{divider}\n"
        f"VRITAL DIGITAL ATELIER · BOUTIQUE COMMUNICATIONS ENGINE\n"
        f"Timestamp: {timestamp}\n"
        f"Recipient: {recipient_email}\n"
        f"Subject: {subject}\n"
        f"{subdivider}\n"
        f"{html_body}\n"
        f"{divider}\n\n"
    )
    
    with open(EMAIL_LOG_PATH, "a", encoding="utf-8") as f:
        f.write(log_entry)


def send_order_confirmation_email(recipient_email: str, order_id: str, customer_name: str, total_amount: float, items: list, shipping_address: str):
    """
    Generates a high-end luxury order confirmation email using a minimal editorial layout.
    """
    subject = f"Order Confirmation: Session {order_id[:8].upper()} · Vrital Atelier"
    
    items_html = ""
    for item in items:
        price_formatted = f"${float(item['price']):.2f}"
        items_html += f"""
        <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 15px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #111111; font-weight: 300;">
                {item['name']} <span style="color: #888888; font-size: 10px; margin-left: 8px;">x{item['quantity']}</span>
            </td>
            <td style="padding: 15px 0; text-align: right; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #111111; font-weight: 400;">
                {price_formatted}
            </td>
        </tr>
        """

    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Vrital Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e5e5e5; padding: 60px 50px;">
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding-bottom: 50px;">
                            <h1 style="margin: 0; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 28px; font-weight: 300; tracking: 0.25em; letter-spacing: 0.25em; color: #000000; text-transform: uppercase;">
                                VRITAL
                            </h1>
                            <p style="margin: 5px 0 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 8px; font-weight: 500; letter-spacing: 0.3em; color: #888888; text-transform: uppercase;">
                                Atelier & Digital Fitting System
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Intro -->
                    <tr>
                        <td style="padding-bottom: 40px; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 18px; line-height: 1.6; color: #111111; font-weight: 300; text-align: center;">
                            Thank you for your order, {customer_name}.
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="padding-bottom: 30px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.8; color: #666666; font-weight: 300; text-align: center; letter-spacing: 0.05em;">
                            We are preparing your exclusive selection. Below is your summary details for order <span style="font-weight: 500; color: #000000;">#{order_id[:8].upper()}</span>.
                        </td>
                    </tr>
                    
                    <!-- Line Items Table -->
                    <tr>
                        <td style="padding-bottom: 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                                <thead>
                                    <tr style="border-bottom: 2px solid #111111;">
                                        <th align="left" style="padding-bottom: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 9px; font-weight: 600; letter-spacing: 0.15em; color: #888888; text-transform: uppercase;">Piece Details</th>
                                        <th align="right" style="padding-bottom: 10px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 9px; font-weight: 600; letter-spacing: 0.15em; color: #888888; text-transform: uppercase;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items_html}
                                    <!-- Total row -->
                                    <tr>
                                        <td style="padding: 20px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; color: #000000; text-transform: uppercase;">
                                            Total Paid
                                        </td>
                                        <td style="padding: 20px 0; text-align: right; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 300; color: #000000;">
                                            ${total_amount:.2f}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Shipping Address Info -->
                    <tr>
                        <td style="padding: 30px; background-color: #fbfbfa; border: 1px solid #f2f2ef; margin-bottom: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #555555;">
                            <span style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #111111; display: block; margin-bottom: 8px;">Shipping Destination</span>
                            {shipping_address}
                        </td>
                    </tr>
                    
                    <!-- Footer Info -->
                    <tr>
                        <td align="center" style="padding-top: 50px; border-t: 1px solid #e5e5e5;">
                            <p style="margin: 0; font-family: 'Times New Roman', Times, Georgia, serif; font-style: italic; font-size: 12px; color: #888888;">
                                Designed for absolute digital elegance.
                            </p>
                            <p style="margin: 20px 0 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 8px; font-weight: 500; letter-spacing: 0.2em; color: #aaaaaa; text-transform: uppercase;">
                                VRITAL ATELIER · ROME · PARIS · TOKYO
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    log_email(recipient_email, subject, html_body)


def send_welcome_email(recipient_email: str, customer_name: str):
    """
    Generates a boutique welcome email inspired by editorial luxury fashion magazines.
    """
    subject = "Welcome to Vrital Digital Atelier"
    
    html_body = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Vrital</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e5e5e5; padding: 60px 50px;">
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding-bottom: 50px;">
                            <h1 style="margin: 0; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 28px; font-weight: 300; tracking: 0.25em; letter-spacing: 0.25em; color: #000000; text-transform: uppercase;">
                                VRITAL
                            </h1>
                            <p style="margin: 5px 0 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 8px; font-weight: 500; letter-spacing: 0.3em; color: #888888; text-transform: uppercase;">
                                Digital Couture & Intelligent Styling
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Portrait Welcome Frame -->
                    <tr>
                        <td align="center" style="padding-bottom: 40px;">
                            <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500&q=80" alt="Vrital Editorial" style="width: 100%; max-width: 500px; height: auto; display: block; border: 1px solid #e5e5e5;" />
                        </td>
                    </tr>
                    
                    <!-- Welcome Title -->
                    <tr>
                        <td style="padding-bottom: 25px; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 22px; line-height: 1.4; color: #111111; font-weight: 300; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">
                            Welcome to the Atelier, {customer_name}.
                        </td>
                    </tr>
                    
                    <!-- Editorial Story -->
                    <tr>
                        <td style="padding-bottom: 40px; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 14px; line-height: 1.8; color: #444444; font-weight: 300; text-align: justify;">
                            Vrital is not an e-commerce platform. It is a digital destination where physical textile physics meets the frontier of generative visual intelligence. 
                            By registering, you have unlocked access to our Neural Sizing Advisor, custom multi-garment look builders, and tactile fabric recoil simulations.
                            We invite you to input your drape measurements to begin constructing your customized style identity memory profile.
                        </td>
                    </tr>
                    
                    <!-- Call To Action -->
                    <tr>
                        <td align="center" style="padding-bottom: 40px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color: #000000; padding: 15px 35px;">
                                        <a href="http://localhost:5173/profile" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; color: #ffffff; text-decoration: none; text-transform: uppercase; display: block;">
                                            Complete Your Style Profile
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer Info -->
                    <tr>
                        <td align="center" style="padding-top: 50px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; font-family: 'Times New Roman', Times, Georgia, serif; font-style: italic; font-size: 12px; color: #888888;">
                                Redefining the digital drape.
                            </p>
                            <p style="margin: 20px 0 0 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 8px; font-weight: 500; letter-spacing: 0.2em; color: #aaaaaa; text-transform: uppercase;">
                                VRITAL DIGITAL ATELIER
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""
    log_email(recipient_email, subject, html_body)
