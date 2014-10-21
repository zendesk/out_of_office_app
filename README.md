# Out of Office App

This app will allow Admins to manage their Agents' vacation statuses, as well as allowing individual Agents to manage their own vacation statuses, and reassigning assigned tickets to their parent group if updated during the vacation.  

There is also an option to unassign all open tickets currently assigned to an Agent, when setting the Agent on vacation, to the parent group. **In order to be able to unassign all open tickets the setting "Allow re-assignment back to the general group." under Settings > Tickets > Assignment must be enabled.**

Please submit bug reports to [the issues page](https://github.com/ZendeskES/out-of-office-app/issues). Pull requests are welcome.

## Features

* On install, the app will create a trigger, which adds a user as a condition to unassign any tickets which are updated while unsolved, and assigned to an unavailable Agent, back to the parent group as unassigned.  
* Setting an Agent to unavailable will add the user to the trigger so updates to their tickets unassign said tickets. 
* Setting the Agent back to available removes them from the trigger 
* Admins can view availability of all Agents with edit priviledges to their availability from all locations
* Agents can set themselves available or unavailable on their user profile
* Agents and Admins can view a ticket's assigned Agent's current out of office status from both the new ticket sidebar and ticket sidebar locations
* (Optional) When setting an Agent as unavailable from the nav bar location, the Admin can unassign all currently open tickets assigned to that Agent back to the parent group
* *Existing Tickets updated by the Requester while Assignee is unavailable resets the Assignee field back to it's parent group and (notifies Requester)
* *New* Tickets CAN NEVER be created with an Assignee that is unavailable
* *Existing* Tickets CAN be updated BY OTHER AgentS while Assignee is marked as unavailable with a warning
* *New* OR *Existing* Tickets CAN be assigned to a group on creation/update without an Assignee as normal
* *New* OR *Existing* Tickets CAN be assigned to an Assignee on creation/update (Barring role level custom permissions) as normal
* *Existing* tickets not currently assigned to an unavailable Agent CAN NOT be assigned to them while they're unavailable, unless the intended Assignee is the current user even if current user is unavailable

## Known Issue

* Currently you're able to assign a ticket to a group with only one Agent in its membership even if the sole Agent in that group is unavailable because currently we aren't checking for this. We will fix this in a future version
* Sometimes *recently assigned tickets* will not be properly reassign with the bulk unassign job when marking an agent as unavailable. If this happens, please wait a few minutes and try again

## Locations

* Nav Bar (Viewed by all Agents/Admins, but the Agent statuses is only editable by the Agents themselves and all Admins)
* Ticket Sidebar (Viewed by all Agents/Admins, but the Agent statuses is only editable by the Agents themselves and all Admins)
* New Ticket Sidebar (Viewed by all Agents/Admins, but the Agent statuses is only editable by the Agents themselves and all Admins)
* User Sidebar (Editable by the Agents setting themselves on vacation, and all Admins)

[More on Zendesk App Locations here](https://developer.zendesk.com/apps/docs/Agent/manifest#location)

## Future versions

* [Check feature status](https://github.com/ZendeskES/out-of-office-app/issues/100) Setting: "Allow existing tickets not assigned to an unavailable Agent to be re-assigned to an unavailable Agent if the unavailable Agent is the current user"
* [Check feature status](https://github.com/ZendeskES/out-of-office-app/issues/90) Custom out of office messages configurable by Agents
* [Check feature status](https://github.com/ZendeskES/out-of-office-app/issues/29) Avatar usage on Agent list in Nav Bar
* [Check feature status](https://github.com/ZendeskES/out-of-office-app/issues/10) Allow custom out of office tag on user field

## Screenshots

#### New Ticket Sidebar, Ticket Sidebar, & User Sidebar

Unavailable:

![](http://i.imgur.com/ZurK10l.png)

Available:

![](http://i.imgur.com/mxdkGqi.png)

#### Nav bar

Overview - status 'here'

![](http://i.imgur.com/IhjI0uB.jpg?1?1534)

Overview - status 'away'

![](http://i.imgur.com/wMU7uNN.jpg?1?2511)

Confirmation popup when setting an Agent as unavailable, including the option to unassign all tickets with a status 'Open'

![](http://i.imgur.com/3cbERSZ.png)

Confirmation popup when setting an Agent as available

![](http://i.imgur.com/9xpRgpE.png)