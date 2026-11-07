import { Metadata } from "next";
import { FulfillerChatCockpit } from "@/components/chat/FulfillerChatCockpit";

export const metadata: Metadata = {
  title: "Live Agent Cockpit | ServiceMeow",
  description: "ITIL Omnichannel Real-Time Queue & Live Agent Dispatch",
};

export default function WorkspaceChatPage() {
  return <FulfillerChatCockpit />;
}
