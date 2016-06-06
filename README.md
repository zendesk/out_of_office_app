:warning: *Use of this software is subject to important terms and conditions as set forth in the License file* :warning:

# Out of Office App

## Description:

This app will allow Admins to manage their Agents' vacation statuses, as well as allowing individual Agents to manage their own vacation statuses, and reassigning assigned tickets to their parent group if updated during the vacation.  

There is also an option to unassign all open tickets currently assigned to an Agent, when setting the Agent on vacation, to the parent group.

Please submit bug reports to [the issues page](https://github.com/ZendeskES/out-of-office-app/issues). Pull requests are welcome.

## Re-assigning Open tickets to a specific Agent

This functionality does not exist by default.

By default the two system triggers that work in the background in conjuction with this app don't include functionality which allows the user to re-assign Open tickets to any specific Agent. 

When the option "Unassign All Open Tickets" is checked those tickets will have the Assignee field become empty but the respective groups will remained assigned to the respective tickets.

That doesn't mean it's not possible - here's how one of the system triggers, 'Ticket: out-of-office app unassign trigger [System Trigger]', is configured by default: 

![](http://i.imgur.com/5EQsqlD.png)

A tag can be added to every ticket unassigned by this app by adding an action to the above trigger which would look something like the following: 

![](http://i.imgur.com/IXtGYdP.png)

Now every time a ticket is unassigned by this system trigger the tag "unassigned_by_ooo_app" will be added. At this point business rules may be created around this new tag. For example one might use this new tag to assign tickets to a specific group or agent on ticket update.

## Tags

* The tag "agent_ooo" is added to the agent's user profile in the user field titled, "Agent Out?" when they mark themselves as unavailable. This tag is used via adding/removing on tickets based on the agent's out of office status. 

* If an Agent changes their OOO status to being unavailable then all Pending/On-Hold tickets have the "agent_ooo" tag added. If the change is to being available then all Pending/On-Hold tickets have the tag removed.

* If an Agent has a ticket assigned to them then changes to being unavailable & updates that ticket without a status of "Open" then the ticket is not tagged with "agent_ooo". If the update includes changing the status to "Open" in that case the ticket gets the "agent_ooo" tag.

* If the Assignee on a ticket is changed from an unavailable agent to an available agent then the "agent_ooo" tag is removed. A ticket can't be assigned to an OOO agent on creation. An existing ticket can't be assigned to an OOO agent.

## Features

* On install, the app will create a trigger, which adds a user as a condition to unassign any tickets which are updated while unsolved, and assigned to an unavailable Agent, back to the parent group as unassigned.  
* Setting an Agent to unavailable will add the user to the trigger so updates to their tickets unassign said tickets. 
* Setting the Agent back to available removes them from the trigger 
* Admins can view availability of all Agents with edit priviledges to their availability from all locations
* Agents can set themselves available or unavailable on their user profile
* Agents and Admins can view a ticket's assigned Agent's current out of office status from both the new ticket sidebar and ticket sidebar locations
* (Optional) When setting an Agent as unavailable from the nav bar location, the Admin can unassign all currently open tickets assigned to that Agent back to the parent group
* *Existing Tickets updated by the Requester while Assignee is unavailable resets the Assignee field back to it's parent group and (notifies Requester)
* *New* Tickets **can never** be created with an Assignee that is unavailable
* *Existing* Tickets **can** be updated **by other agents** while Assignee is marked as unavailable with a warning
* *New* or *Existing* Tickets **can** be assigned to a group on creation/update without an Assignee as normal
* *New* or *Existing* Tickets **can** be assigned to an Assignee on creation/update (Barring role level custom permissions) as normal
* *Existing* tickets not currently assigned to an unavailable Agent **can not** be assigned to them while they're unavailable, unless the intended Assignee is the current user even if current user is unavailable

## Known Issues & Limitations

* Currently agent's are able to assign a ticket to a group with only one Agent in its membership even if the sole Agent in that group is unavailable because currently we aren't checking for this. *We will fix this in a future version*
* "Error: Unable to get list of agents." will display for users in this role ![](http://i.imgur.com/059TpZW.png)
* Intermittently when marking an agent as OOO and un-assigning all open tickets only some of the tickets will actually get unassigned
* When a ticket assigned to an OOO agent gets updated the ticket gets assigned back to the parent group with a null Assignee value - the trigger working in the background during this action does not currently send an email notification to the agents in the group notifying them this happened
* The app will not prevent assigning tickets unless the ticket is updated individually through the Zendesk interface. Triggers, the Mail API, and REST API, and bulk editing will all be able to bypass the assignment restrictions

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

## Screenshot(s):

##### Administrator experience: 

![](http://g.recordit.co/7dfkDvTIFX.gif)
![](http://g.recordit.co/5nz3l4M0WR.gif)

##### Agent experience: 

![](http://g.recordit.co/j6GPUfHDIb.gif)

##### Look for this in the Zendesk Apps Marketplace

![](http://i.imgur.com/4Xzod2H.png)
