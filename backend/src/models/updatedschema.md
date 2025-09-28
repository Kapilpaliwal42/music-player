Database Schema
User
Field	Type	Required	Unique	Default	Notes
_id	ObjectId	Yes	Yes		Primary Key
fullname	String	Yes	No		Should be lowercase (see suggestion)
email	String	Yes	Yes		
username	String	Yes	Yes		
password	String	Yes	No		Hashed
role	String (enum)	No	No	"user"	"user" or "admin"
profileImage	String	No	No	""	
isActive	Boolean	No	No	true	
refreshToken	String	No	No	""	
history	[ObjectId]	No	No		See suggestion below
createdAt	Date	Yes	No		Auto-generated
updatedAt	Date	Yes	No		Auto-generated
Relationships:

history should be an array of Song references ([ObjectId], ref: "Song").
Song
Field	Type	Required	Notes
_id	ObjectId	Yes	Primary Key
name	String	Yes	
artist	String	Yes	(See suggestion)
description	String	No	
album	String	Yes	(See suggestion)
year	Number	Yes	
genre	String	Yes	
duration	Number	Yes	In seconds
coverImage	String	Yes	URL/path
audioFile	String	Yes	URL/path
lyrics	String	No	
createdAt	Date	Yes	Auto-generated
updatedAt	Date	Yes	Auto-generated
Relationships:

artist and album are currently strings, but should reference Artist and Album collections.
Album
Field	Type	Required	Notes
_id	ObjectId	Yes	Primary Key
name	String	Yes	
artist	String	Yes	(See suggestion)
description	String	No	
releaseDate	Date	Yes	
genre	String	Yes	
coverImage	String	Yes	URL/path
songs	[ObjectId]	No	ref: "Song"
createdAt	Date	Yes	Auto-generated
updatedAt	Date	Yes	Auto-generated
Relationships:

artist should reference Artist collection.
Artist
Field	Type	Required	Notes
_id	ObjectId	Yes	Primary Key
name	String	Yes	
description	String	No	
genre	String	Yes	
image	String	Yes	URL/path
createdAt	Date	Yes	Auto-generated
updatedAt	Date	Yes	Auto-generated
Playlist
Field	Type	Required	Notes
_id	ObjectId	Yes	Primary Key
name	String	Yes	
description	String	No	
user	ObjectId	Yes	ref: "User"
songs	[ObjectId]	No	ref: "Song"
createdAt	Date	Yes	Auto-generated
updatedAt	Date	Yes	Auto-generated
Suggestions for Improvement