import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCoverageStore } from "@/hooks/useCoverageStore";
import { cn } from "@/lib/utils";
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}
export function ChatDock() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    content: "Hi! I can help you understand your coverage. Try asking about rental cars, trip protection, or what's covered."
  }]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const totalItems = useCoverageStore(state => state.getTotalItems());
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
 const handleSend = async () => {
  const text = input.trim();
  if (!text || isLoading) return;

  console.log("1. handleSend triggered with:", text);

  // Add user message
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: "user",
    content: text,
  };
  setMessages((prev) => [...prev, userMessage]);
  setInput("");

  // Check if user has any coverage
  console.log("2. totalItems:", totalItems);
  
  if (totalItems === 0) {
    console.log("3. No items - showing empty state message");
    setTimeout(() => {
      const response: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          "Add some cards or policies to your Coverage Library first, and I'll be able to answer questions about your specific coverage.",
      };
      setMessages((prev) => [...prev, response]);
    }, 300);
    return;
  }

  // Build conversation history
  const historyForApi: ChatMessage[] = messages
    .filter((m) => m.id !== "welcome")
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  const cards = getFormattedCards();
  const policies = getFormattedPolicies();
  
  console.log("4. About to call API with:", {
    question: text,
    cards,
    policies,
    historyLength: historyForApi.length,
  });

  setIsLoading(true);

  try {
    console.log("5. Calling askCoverageAssistant...");
    const result = await askCoverageAssistant(
      text,
      cards,
      policies,
      historyForApi
    );
    console.log("6. Got result:", result);

    // ... rest of the function
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setTimeout(() => {
      const response: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: totalItems === 0 ? "Add some cards or policies first, and I'll be able to answer questions about your specific coverage." : "Based on your coverage library, I can help analyze that scenario. This feature will provide detailed answers once connected to the coverage database."
      };
      setMessages(prev => [...prev, response]);
    }, 500);
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return <Card className="border border-border shadow-soft overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2 text-xl font-sans">
          <MessageCircle className="w-4 h-4 text-primary" />
          Coverage Assistant
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ask questions about your coverage
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-[180px] max-h-[240px] overflow-y-auto">
        <div className="p-3 space-y-2">
          {messages.map(message => <div key={message.id} className={cn("max-w-[85%] px-3 py-2 rounded-xl text-sm", message.role === "user" ? "ml-auto bg-secondary text-secondary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm border border-border")}>
              {message.content}
            </div>)}
        </div>
      </div>

      <div className="p-3 border-t border-border space-y-2">
        <div className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about your coverage..." className="flex-1 text-sm rounded-full" />
          <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="rounded-full flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" />
          AI-powered responses coming soon
        </p>
      </div>
    </Card>;
}