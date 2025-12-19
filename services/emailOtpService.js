import AWS from "aws-sdk";

export const sendEmailVerificationOtp = async ({ to, otp }) => {
  const from = process.env.SES_FROM_EMAIL;

  if (!from) {
    throw new Error("Email service not configured");
  }

  const region = process.env.AWS_REGION || "us-east-1";
  const ses = new AWS.SES({ region });

  const params = {
    Source: from,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: "Verify your ArtFlow email" },
      Body: {
        Text: {
          Data: `Your ArtFlow verification code is: ${otp}\n\nThis code expires in 10 minutes.`
        }
      }
    }
  };

  await ses.sendEmail(params).promise();
  return { ok: true, mode: "ses" };
};
