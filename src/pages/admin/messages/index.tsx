import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessagesToolbar,
  type MessagesFilterState,
} from "./components/MessagesToolbar";
import { ContactMessagesTable } from "./components/ContactMessagesTable";
import { CallbackRequestsTable } from "./components/CallbackRequestsTable";
import {
  useContactMessagesQuery,
  useCallbackRequestsQuery,
} from "./hooks/useAdminMessages";

/**
 * AdminMessages (orchestrator)
 * ==============================================================
 * Two tabs in one panel:
 *   1. "Contact form"   → contact_messages table
 *   2. "Callbacks"      → callback_requests table
 *
 * Each tab keeps its own filter state. Submissions come from
 * the public Contact page + callback widget.
 */
const AdminMessages = () => {
  const [tab, setTab] = useState<"contact" | "callback">("contact");
  const [contactFilters, setContactFilters] = useState<MessagesFilterState>({
    search: "",
    status: "",
  });
  const [callbackFilters, setCallbackFilters] = useState<MessagesFilterState>({
    search: "",
    status: "",
  });

  const contactsQ = useContactMessagesQuery({
    search: contactFilters.search || undefined,
    status: contactFilters.status || undefined,
  });
  const callbacksQ = useCallbackRequestsQuery({
    search: callbackFilters.search || undefined,
    status: callbackFilters.status || undefined,
  });

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "contact" | "callback")} className="space-y-3">
      <TabsList>
        <TabsTrigger value="contact">
          Contact form{contactsQ.data ? ` (${contactsQ.data.length})` : ""}
        </TabsTrigger>
        <TabsTrigger value="callback">
          Callbacks{callbacksQ.data ? ` (${callbacksQ.data.length})` : ""}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="contact" className="space-y-3 mt-0">
        <MessagesToolbar
          state={contactFilters}
          onChange={setContactFilters}
          count={contactsQ.data?.length ?? 0}
          countLabel="messages"
        />
        <ContactMessagesTable rows={contactsQ.data ?? []} loading={contactsQ.isLoading} />
      </TabsContent>

      <TabsContent value="callback" className="space-y-3 mt-0">
        <MessagesToolbar
          state={callbackFilters}
          onChange={setCallbackFilters}
          count={callbacksQ.data?.length ?? 0}
          countLabel="requests"
        />
        <CallbackRequestsTable rows={callbacksQ.data ?? []} loading={callbacksQ.isLoading} />
      </TabsContent>
    </Tabs>
  );
};

export default AdminMessages;
