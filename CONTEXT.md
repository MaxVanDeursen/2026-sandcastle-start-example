# Urenbrug

A consultant logs hours once; Urenbrug pushes them to every hour server that needs them.

## Language

**Consultant**:
The person logging hours. There is exactly one, the user of the app.
_Avoid_: employee, user (in domain text)

**Client**:
An organisation the Consultant does work for. Internal work counts as Client *Dignitas*.
_Avoid_: customer

**Project**:
A piece of work for exactly one Client. Clients and Projects are a fixed list in code.

**Time Entry**:
A number of hours (steps of 0.25) the Consultant worked on one Project on one date, with a description, logged on the Timesheet.
_Avoid_: hour, booking, registration

**Timesheet**:
The main page where the Consultant logs and edits Time Entries. The single source of truth.
_Avoid_: hour page, main page

**Hour Server**:
An external system that wants to receive the Consultant's hours. There are two: the Dignitas Hour Server and the Client Hour Server. Both are fakes living inside this app.
_Avoid_: target, backend, integration

**Dignitas Hour Server**:
The employer's hour server. Receives every Time Entry.

**Client Hour Server**:
The hour server of Client *Acme Logistics*. Receives only Time Entries for that Client's Projects.

**Hour Server Page**:
A page per Hour Server showing what that server has recorded, to check it matches the Timesheet.
_Avoid_: system page, mirror

**Sync**:
Pushing a Time Entry's current state (create, update, delete) from the Timesheet to the Hour Servers.
_Avoid_: export, upload

**Sync Status**:
Per Time Entry, per Hour Server: the server's own id for the record plus `synced`, `failed` or `not applicable`.

**Offline**:
A fake Hour Server switched off from its Hour Server Page. It answers every call with `503`.
_Avoid_: down, broken

**Deletion pending**:
A deleted Time Entry that some Hour Server still holds because its delete failed. Stays on the Timesheet, struck through, until a Retry succeeds.
