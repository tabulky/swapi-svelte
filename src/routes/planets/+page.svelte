<script lang="ts">
  let { data } = $props();
</script>

<h1>Planets</h1>

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Climate</th>
      <th>Terrain</th>
      <th>Gravity</th>
      <th>SurfaceWater</th>
      <th>RotationPeriod</th>
      <th>OrbitalPeriod</th>
      <th>Diameter</th>
      <th>Population</th>
      <th>Residents</th>
      <th>Films</th>
    </tr>
  </thead>
  <tbody>
    {#await data.planets}
      <tr>
        <td colspan="11">Loading...</td>
      </tr>
    {:then planets}
      {#each planets as planet (planet.url)}
        <tr>
          <td>{planet.name}</td>
          <td>{planet.climate}</td>
          <td>{planet.terrain}</td>
          <td>{planet.gravity}</td>
          <td>{planet.surface_water}</td>
          <td>{planet.rotation_period}</td>
          <td>{planet.orbital_period}</td>
          <td>{planet.diameter}</td>
          <td>{planet.population}</td>
          <td>{planet.residents.length}</td>
          <td>{planet.films.length}</td>
        </tr>
      {/each}
    {:catch error}
      <tr>
        <td colspan="11">Error loading planets: {error.message}</td>
      </tr>
    {/await}
  </tbody>
</table>
