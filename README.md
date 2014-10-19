# Out of Office App

This app will allow admins to manage their agents' vacation statuses, as well as allowing individual agents to manage their own vacation statuses, and reassigning assigned tickets to their parent group if updated during the vacation.  

There is also an option to unassign all open tickets currently assigned to an agent, when setting the agent on vacation, to the parent group. **In order to be able to unassign all open tickets the setting "Allow re-assignment back to the general group." under Settings > Tickets > Assignment must be enabled.**

Please submit bug reports to [the issues page](https://github.com/ZendeskES/out-of-office-app/issues). Pull requests are welcome.

## Features

* On install, the app will create a trigger, which adds a user as a condition to unassign any tickets which are updated while unsolved, and assigned to an unavailable agent, back to the parent group as unassigned.  
* Setting an agent to unavailable will add the user to the trigger so updates to their tickets unassign said tickets.  
* Admins can view availability, as well as edit agents' status to make them available or unavailable from the user sidebar or navbar
* Agents can set themselves available or unavailable from their user profile via the user sidebar location
* Agents and Admins can view a ticket's assigned agent's current vacation status from within any ticket on the ticket apps panel
* (Optional) When setting an agent as unavailable from the nav bar location, the admin can unassign all currently open tickets assigned to that agent back to the parent group
* Setting the agent back to available removes them from the trigger

## Locations

The app has three locations: nav bar, user sidebar, and ticket sidebar.  The nav bar can be viewed by all agents/admins, but the agent statuses can only be edited by admins. The user sidebar location is editable by the agents setting themselves on vacation, or admins.  The ticket sidebar is read-only, to simply display the currently assigned agent's status.

## Screenshots

####User Sidebar

Unavailable:

![](http://content.screencast.com/users/AL14/folders/Jing/media/e33dc957-3513-4cd5-a23d-55312a97c599/00000975.png)

Available:

![](http://content.screencast.com/users/AL14/folders/Jing/media/1f0d27ac-a745-4350-b2e1-fb7840d27e15/00000976.png)

####Ticket Sidebar:

Unavailable:

![](http://content.screencast.com/users/AL14/folders/Jing/media/a42fa21e-b29a-4053-85cf-abf6fe70b1c7/00000978.png)

Available:

![](http://content.screencast.com/users/AL14/folders/Jing/media/e18e2a60-fbf0-4370-87a2-bfe1b3a3b8cf/00000977.png)

####Nav bar

Overview - status 'here':

![](http://i.imgur.com/IhjI0uB.jpg?1?1534)

Overview - status 'away':

![](http://i.imgur.com/wMU7uNN.jpg?1?2511)

Confirmation popup when setting an agent on vacation, including the option to unassign all open tickets:

![](http://content.screencast.com/users/AL14/folders/Jing/media/84be3332-b1dc-4aae-ab41-a09f848cf0db/00000973.png)
