# How to store world
## Chunks
### 1. Map/Object with string keys
- Can't use object keys as:
  - For `Object`, everything gets converted to string, making all objects `[object Object]` which is completely useless
  - For `Map`, keys are differentiated by reference so `[2, 3] != [2, 3]`
- So can use string keys eg. `world["2,3"]`
- but stringfying the object to make the key has bad performance (I think)

### 2. 4 separate 2D lists for quadrants
- Use separate lists for `+X,+Z`, `+X,-Z`, `-X,+Z`, `-X,-Z`
- But harder to expand to 3D chunks when required

### 3. Weird list indices
- Store chunks as (1D example) `[0, 1, -1, 2, -2, ...]`
- Easy to exaand to 3D and decent performance
- but do I really want another list with weird indices?

### Inter-chunk links
- Each chunk has links to chunk next to it in all directions
- Ways this could be structures:
  - separate attribute names for each link:
    - readable, fast
    - slow/hard to access when direction is not known statically
  - stored as array:
    - either nested `[[-X,+X], [-Y,+Y], [-Z,+Z]]`
    - or flat `[-X,+X, -Y,+Y, -Z,+Z]`
    - I prefer nestedas it looks nicer
- On its own, this would be quite useless but in combination with one of the other ones, it could be quite good
