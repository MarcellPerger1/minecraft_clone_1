# Ideas to improve performance
- Currently, the slowest tyhing is the rendering as not much else happens (yet)

## 1. Caching meshes
- Cache the mesh for each chunk
- This could even be split further into sub-chunks (perhaps 4x4x4 or 8x8x8)

### Ticks
- Every tick/frame (same thing for now), `hasChanged` set to `false` in each chunk
- If a block is changed, set `hasChanged` to `true` in that chunk

### Rendering
- Rendering is done after the tick takes place
- Each chunk has its own mesh
- Those meshes are `concat`-ed together into a single mesh
- For each chunk:
  - If `hasChanged` is `true` for that chunk, recalculate the mesh and re-insert it into global mesh table
  - If `hasChanged` is `false` for that chunk, continue onto next chunk

#### Async?
- Same as above except:
- When a chunk needs to be recalculated, make an async thing that reinserts it into global mesh table once complete.
- This way, the main 'thread' isn't blocked by recalculating the mesh
- Also, a serial number also needs to exist so that an earlier mesh doesn't accidentally override later mesh that finished earlier
- Actually, there is no real way to make it truly async apart from using workers (?)
- However, if 2 changes happened very quickly it might be a waste to recalculate the mesh twice (if the first one has not been calculated by the time the second changes take place).

##### Cancelling outdated calculations
- This should only be done if
  - a new one comes in within a certain amount of the previous calculation and
  - the first one isn't already complete / has just started
- Is there an easy way to cancel the previous calculation?
  - There is no built-in way to cancel promises
  - Perhaps this could be done by checking for the condition every `n` vertices
- However, the calculations will probably be quite small so cancelling them probably won't be worth it as they will have already completed
- Also, if lots of events happen very closes together (eg. insta-mining), the mesh might not be updated at all as the previous one keep getting discarded before being complete
- Therefore, this isn't really needed because of all the drawbacks